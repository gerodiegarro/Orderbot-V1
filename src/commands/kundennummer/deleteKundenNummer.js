const { SlashCommandBuilder } = require('@discordjs/builders');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const apikeys = require('../../../apiKey.json');
const { google } = require('googleapis');
const config = require('../../../config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-kunden-nummer')
        .setDescription('Löscht eine KundenNummer aus dem System')

        .addUserOption(
            option => option
                .setName('user')
                .setDescription('Wähle den User aus, von dem die KundenNummer gelöscht werden soll')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const userInformation = interaction.options.getUser('user').username;

        try {
            const checkUser = await prisma.createKunde.findMany({
                where: {
                    username: userInformation
                }
            });

            if (checkUser.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('Kundennummer nicht gefunden')
                    .setDescription(`Der Benutzer **${userInformation}** hat keine KundenNummer`)
                    .setColor(config.bot.allgemein[0].embedColor);

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const deleteKunde = await prisma.createKunde.deleteMany({
                where: {
                    username: userInformation
                }
            });

            const auth = new google.auth.JWT(
                apikeys.client_email,
                null,
                apikeys.private_key,
                ['https://www.googleapis.com/auth/drive']
            );

            const drive = google.drive({ version: 'v3', auth });

            const folderName = userInformation;
            const response = await drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
                fields: 'files(id)'
            });

            const folders = response.data.files;

            if (folders.length === 0) {
                console.log(`Ordner mit dem Namen '${folderName}' wurde nicht gefunden.`);
                await interaction.reply(`Ordner mit dem Namen '${folderName}' wurde nicht gefunden.`);
                return;
            }

            const folderId = folders[0].id;
            await drive.files.delete({ fileId: folderId });

            console.log(`Ordner mit dem Namen '${folderName}' wurde erfolgreich gelöscht.`);

            const embed = new EmbedBuilder()
                .setTitle('Kundennummer Erfolgreich gelöscht')
                .setDescription(`Die Kundennummer von **${userInformation}** und der Ordner (${folderName}) wurde erfolgreich gelöscht`)
                .setColor(config.bot.allgemein[0].embedColor);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Fehler beim Löschen des Ordners:', error);
            await interaction.reply('Es ist ein Fehler aufgetreten.');
        }
    }
};
