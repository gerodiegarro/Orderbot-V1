const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const apikeys = require('../../../apiKey.json');
const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const path = require('path'); 
const  config  = require('../../../config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('finish-order')
        .setDescription('finish und stellt die bestellung zu')
        .addStringOption(
            option => option
                .setName('orderid')
                .setDescription('die Orderid von der Bestellung')
                .setRequired(true)
        )
        .addAttachmentOption(
            option => option
                .setName('file')
                .setDescription('filename')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const orderId = interaction.options.getString('orderid');
        const fileAttachment = interaction.options.getAttachment('file');
        const fileUrl = fileAttachment.url;
        const fileName = fileAttachment.name;
        const localFilePath = path.join(__dirname, `../../../kundenfiles/${fileName}`);

        const findOrder = await prisma.orderSystem.findMany({
            where: {
                orderId: orderId
            }
        });

        if (findOrder.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('OrderId nicht gefunden')
                .setDescription('Deine Orderid wurde nicht gefunden!')
                .setColor(config.bot.allgemein[0].embedColor);

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const produkt = findOrder[0].orderProdukt;
        const email = findOrder[0].email;
        const kundenNummer = await prisma.createKunde.findMany({
            where: {
                email: email
            }
        });
        const userName = kundenNummer[0].username;

        const auth = new google.auth.JWT(
            apikeys.client_email,
            null,
            apikeys.private_key,
            ['https://www.googleapis.com/auth/drive']
        );

        const drive = google.drive({ version: 'v3', auth });

        async function findOrCreateFolder(folderName) {
            try {
                const folder = await findFolderByName(folderName);
                if (folder) {
                    return folder;
                } else {
                    return await createFolder(folderName);
                }
            } catch (error) {
                console.error('Fehler beim Suchen oder Erstellen des Ordners:', error);
                return null;
            }
        }

        async function findFolderByName(folderName) {
            try {
                const response = await drive.files.list({
                    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
                    fields: 'files(id, name)',
                });
                const folders = response.data.files;

                if (folders.length === 0) {
                    console.log(`Ordner mit dem Namen '${folderName}' wurde nicht gefunden.`);
                    return null;
                }
                return folders[0];
            } catch (error) {
                console.error('Fehler beim Suchen des Ordners:', error);
                return null;
            }
        }

        async function createFolder(folderName) {
            try {
                const response = await drive.files.create({
                    requestBody: {
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder'
                    }
                });
                return response.data;
            } catch (error) {
                console.error('Fehler beim Erstellen des Ordners:', error);
                return null;
            }
        }

        const folderName = userName;
        const folder = await findOrCreateFolder(folderName);

        if (!folder) {
            const embed = new EmbedBuilder()
                .setTitle('Fehler')
                .setDescription(`Der Ordner für den Benutzer '${userName}' konnte nicht gefunden oder erstellt werden!`)
                .setColor(config.bot.allgemein[0].embedColor);

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const folderId = folder.id;

        const response = await axios.get(fileUrl, { responseType: 'stream' });
        const fileStream = fs.createWriteStream(localFilePath);
        response.data.pipe(fileStream);

        fileStream.on('finish', async () => {
            console.log('Datei erfolgreich heruntergeladen:', localFilePath);

            const fileUpload = {
                mimeType: 'application/x-rar-compressed',
                body: fs.createReadStream(localFilePath),
            };

            try {
                const response = await drive.files.create({
                    requestBody: {
                        name: fileName,
                        parents: [folderId]
                    },
                    media: fileUpload
                });

                const embed = new EmbedBuilder()
                    .setTitle('Order Zugestellt')
                    .setDescription(`Die Order(${orderId}) wurde erfolgreich zugestellt`)
                    .addFields({ name: "Du hast erhalten", value: '```' + produkt + '```' })
                    .addFields({ name: 'Informationen', value: `Deine fertige Bestellung wurde an die **${email}** erfolgreich gesendet. Bei Fragen sind wir immer erreichbar :)` })
                    .setColor(config.bot.allgemein[0].embedColor);

                const deleteOrder = await prisma.orderSystem.deleteMany({
                    where: {
                        orderId: orderId
                    }
                });

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Fehler beim Hochladen der Datei:', error);
                const embed = new EmbedBuilder()
                    .setTitle('Fehler')
                    .setDescription('Ein Fehler ist beim Hochladen der Datei aufgetreten!')
                    .setColor(config.bot.allgemein[0].embedColor);

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        });
    }
};
