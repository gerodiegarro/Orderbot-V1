const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
const config = require('../../../config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkunde')
        .setDescription('gibt dir alle daten über den user')
        .addUserOption(option => option
            .setName('kunde')
            .setDescription('den kunde den du auswählen möchtest')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {

        const user = interaction.options.getUser('kunde').username;
        console.log(user)

        const findKundenNummer = await prisma.createKunde.findMany({
            where: {
                username: user
            }
        })

        if (findKundenNummer.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('Keine Kundennummer gefunden')
                .setDescription(`Auf den User **(${user})** wurde kein Eintrag gefunden`)
                .setColor(config.bot.allgemein[0].embedColor)
            return (
                interaction.reply({ embeds: [embed], ephemeral: true })
            )
        }
        const kundenNummer = findKundenNummer[0].kundenNummer;
        const email = findKundenNummer[0].email;


        const embed = new EmbedBuilder()
            .setTitle('Infos')
            .setDescription(`Alle Infos über den User **(${user})**`)
            .addFields(
                { name: 'Kundennummer', value: '```' + kundenNummer + '```' },
                { name: 'Email', value: '```' + email + '```' },
            )
            .setColor(config.bot.allgemein[0].embedColor)

        await interaction.reply({ embeds: [embed] })


    }
}