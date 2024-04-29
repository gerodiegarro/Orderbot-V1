const { SlashCommandBuilder } = require('@discordjs/builders');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const  config  = require('../../../config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-rabattcode')
        .setDescription('löscht einen Rabattcode aus dem System')
        .addStringOption(option => option
            .setName('rabattcode')
            .setDescription('der name des rabatt codes')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const name = interaction.options.getString('rabattcode')

        const findRabattCode = await prisma.rabattCodes.findMany({
            where: {
                name: name
            }
        })

        const rabattRole = findRabattCode[0].rolle

        if (findRabattCode.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('Kein Rabattcode gefunden')
                .setDescription('Der Rabattcode wurde nicht gefunden')
                .setColor(config.bot.allgemein[0].embedColor)

            return (
                interaction.reply({ embeds: [embed], ephemeral: true })
            )

        }

        const deleteRabattCode = await prisma.rabattCodes.deleteMany({
            where: {
                name: name,
            }
        })

        const roleToDelete = interaction.guild.roles.cache.find(role => role.name === rabattRole);
        if (!roleToDelete) {
            return interaction.reply({ content: 'Die Rolle wurde nicht gefunden!', ephemeral: true });
        }

        try {
            await roleToDelete.delete();
        } catch (error) {
            console.error('Fehler beim Löschen der Rolle:', error);
        }

        const embed = new EmbedBuilder()
            .setTitle('Rabattcode erfolgreich gelöscht')
            .setDescription(`Dein Rabattcode **(${name})** wurde erfolgreich gelöscht`)
            .setColor(config.bot.allgemein[0].embedColor)

        await interaction.reply({ embeds: [embed] })
    }
}