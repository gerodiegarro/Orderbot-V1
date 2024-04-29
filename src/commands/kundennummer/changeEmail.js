const { SlashCommandBuilder } = require('@discordjs/builders');
const { PrismaClient } = require('@prisma/client');
const { EmbedBuilder } = require('discord.js');
const prisma = new PrismaClient()
const  config  = require('../../../config')



module.exports = {
    data: new SlashCommandBuilder()
        .setName('change-email')
        .setDescription('ändere die Email deiner Kundennunmer')
        .addStringOption(option => option
            .setName('kundennummer')
            .setDescription('deine kundennummer')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('email')
            .setDescription('deine neue email')
            .setRequired(true)
        ),
    async execute(interaction) {

        const newEmail = interaction.options.getString('email')
        const kundenNummer = interaction.options.getString('kundennummer')


        const checkUser = await prisma.createKunde.findMany({
            where: {
                kundenNummer: kundenNummer,
            }

        })

        if (checkUser.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`Keine Kundennummer gefunden`)
                .setDescription(`Deine angegebene kundennummer gibt es nicht`)
                .setColor(config.bot.allgemein[0].embedColor)

            return (
                interaction.reply({ embeds: [embed], ephemeral: true })
            )
        } else {

            const updateEmail = await prisma.createKunde.updateMany({

                where: {
                    kundenNummer: kundenNummer
                },
                data: {
                    email: newEmail
                }
            })
        }

        const embed = new EmbedBuilder()
            .setTitle('Email erfolgreich geändert')
            .setDescription(`Deine Email wurde erfolreich auf **${newEmail}** geändert`)
            .setColor(config.bot.allgemein[0].embedColor)

        await interaction.reply({ embeds: [embed] })

    }
}