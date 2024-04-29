const { SlashCommandBuilder } = require('@discordjs/builders');
const { google } = require('googleapis');
const apikeys = require('../../../apiKey.json');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-all-folders')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription('Löscht alle Ordner im Google Drive'),

    async execute(interaction) {
        const auth = new google.auth.JWT(
            apikeys.client_email,
            null,
            apikeys.private_key,
            ['https://www.googleapis.com/auth/drive']
        );

        const drive = google.drive({ version: 'v3', auth });

        try {
            const response = await drive.files.list({
                q: "mimeType='application/vnd.google-apps.folder'",
                fields: 'files(id, name)'
            });

            const folders = response.data.files;

            if (folders.length === 0) {
                await interaction.reply({ content: 'Es wurden keine Ordner gefunden, es sind schon alle gelöscht', ephemeral: true });
                return;
            }

            for (const folder of folders) {
                await drive.files.delete({ fileId: folder.id });
                console.log(`Ordner '${folder.name}' erfolgreich gelöscht.`);
            }
        } catch (error) {
            console.error('Fehler beim Löschen der Ordner:', error);
            await interaction.reply('Es ist ein Fehler aufgetreten.');
        }

        await interaction.reply({ content: 'Alle Ordner erfolreich gelöscht', ephemeral: true })
    }
};
