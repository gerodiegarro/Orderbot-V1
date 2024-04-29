const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const  config  = require('../../../config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-rabattcode')
        .setDescription('erstellt ein neuen rabatt code')
        .addStringOption(
            option => option
                .setName('name')
                .setDescription('der name vom rabatt code')
                .setRequired(true)
        )
        .addNumberOption(option => option
            .setName('prozent')
            .setDescription('wie viel prozent der rabatt code hat')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('role')
            .setDescription('eine rolle die erforderlich sein muss')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const name = interaction.options.getString('name')
        const prozent = interaction.options.getNumber('prozent')
        const role = interaction.options.getString('role')

        const findRabattCode = await prisma.rabattCodes.findMany({
            where: {
                name: name
            }
        })

        const createRole = await interaction.guild.roles.create({
            name: role,
            color: 'Red',
            reason: 'Eine rolle für ein Rabattcode'
        });

        if (findRabattCode.length > 0) {

            const embed = new EmbedBuilder()
                .setTitle('Rabattcode existiert berreits')
                .setDescription(`Den Rabattcode **${name}** gibt es berreits`)
                .setColor(config.bot.allgemein[0].embedColor)

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const createRabattCode = await prisma.rabattCodes.create({
                data: {
                    name: name,
                    prozent: prozent,
                    rolle: role,

                }
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("Rabattcode erfolgreich erstellt")
            .setDescription(`Dein Rabattcode **${name}** wurde erfolgreich erstellt und ist jetzt für andere user einsatzt bereit`)
            .setColor(config.bot.allgemein[0].embedColor)

        await interaction.reply({ embeds: [embed] })
    }
}
