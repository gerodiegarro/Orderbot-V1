const { SlashCommandBuilder } = require(`@discordjs/builders`);
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const config = require('../../../config');
const apikeys = require('../../../apiKey.json');


module.exports = {
    data: new SlashCommandBuilder()

        .setName('create-kunden-nummer')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(
            option => option
                .setName('kunden')
                .setDescription('gib den Kunden an')
                .setRequired(true)
        )
        .addStringOption(
            option => option
                .setName('email')
                .setDescription('email of the user')
                .setRequired(true)
        )

        .setDescription('erstellt eine Kunden Nummer für einen neuen Kunden'),



    async execute(interaction) {
       
        const generateKundenKey = () => {
            var length = 10,
                charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                retVal = "";
            for (var i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            return retVal;
        }

        const user = interaction.options.getUser('kunden')
        const email = interaction.options.getString('email')
        const key = generateKundenKey();

        const existingUser = await prisma.createKunde.findUnique({
            where: {
                username: user.username,
                email: email
            }
        });

        if (existingUser) {
            const embed = new EmbedBuilder()
                .setTitle('Fehler')
                .setDescription(`Der User ${user} hat bereits eine Kundennummer`)
                .setColor(config.bot.allgemein[0].embedColor)

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const guild = interaction.guild;
            const kundenRolleID = config.bot.KundenSystem[0].kundenRolle;
            const userID = user.id;

            try {
                const member = await guild.members.fetch(userID);

                if (member && member.roles) {

                    if (member.roles.cache.has(kundenRolleID)) {
                        await interaction.reply({ content: "Du hast bereits die erforderliche Rolle.", ephemeral: true });
                        return;
                    } else {
                        await member.roles.add(kundenRolleID);
                    }
                } else {
                    throw new Error("Das Mitglied ist nicht definiert oder hat keine Rollen-Eigenschaft.");
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: "Ein Fehler ist beim Hinzufügen der Rolle aufgetreten." });
            }

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: config.bot.nodeMailer[0].serviceEmail,
                    pass: config.bot.nodeMailer[0].password
                }
            });

            const auth = new google.auth.JWT(
                apikeys.client_email,
                null,
                apikeys.private_key,
                ['https://www.googleapis.com/auth/drive']
            );

            const drive = google.drive({ version: 'v3', auth });

            try {
                const response = await drive.files.create({
                    requestBody: {
                        name: user.username,
                        mimeType: 'application/vnd.google-apps.folder'
                    }
                });

                const folderId = response.data.id;
                const Driveemail = email;

                await drive.permissions.create({
                    fileId: folderId,
                    requestBody: {
                        role: 'reader',
                        type: 'user',
                        emailAddress: Driveemail,
                    }
                })

                const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
                const fullFolderUrl = folderUrl;

                const createUser = await prisma.createKunde.create({
                    data: {
                        username: user.username,
                        kundenNummer: key,
                        email: email,
                        googleDriveLink: fullFolderUrl,
                    }
                })

                const mailOptions = {
                    from: config.bot.nodeMailer[0].serviceEmail,
                    to: email,
                    subject: 'Kundennummer erstellt',
                    html: `<html>
                                <head>
                                    <style>
                                        body {
                                            font-family: Arial, sans-serif;
                                        }
                                        .message {
                                            background-color: #f9f9f9;
                                            padding: 20px;
                                            border-radius: 10px;
                                            font-size: 15px;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="message">
                                        <p>Hallo <i>${user.username}</i>,</p>
                                        <p>Deine Kundennummer (${key}) wurde erfolgreich erstellt.</p>
                                        <p>Deine Einkäufe findest du in unserer Online Cloud, dein Link dafür ist: ${folderUrl}
                                        <p>Bei Fragen sind wir immer erreichbar.</p>
                                    </div>
                                </body>
                            </html>`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.error('Fehler beim Senden der E-Mail:', error);
                    } else {
                        console.log('E-Mail erfolgreich gesendet:', info.response);
                    }
                });

                const keyEmbed = new EmbedBuilder()
                    .setTitle("Neue Kundennummer")
                    .setDescription(`Neue Kundennummer wurde erfolgreich für ${user} erstellet`)
                    .setColor(config.bot.allgemein[0].embedColor)
                    .addFields({ name: "Informations", value: `Bitte bewahre die Kundennummer gut auf, mit \`/my-orders\`  kannst du diese im Notfall wieder aufrufen,  du kannst außerdem alle deine bisherigen einkäufe sehen und wieder erneut runterladen, falls du sie verloren hast. ` })
                    .addFields({ name: 'Email', value: "Du hast eine Email erhalten in der du über alles Informiert wirst, wir wünschend dir viel Spaß" })
                    .addFields({ name: "Email", value: '```' + email + '```' })
                    .addFields({ name: "Kundennummer", value: '```' + key + '```' })
                    .addFields({ name: "Dein Kundenordner", value: '```' + fullFolderUrl + '```' })

                await interaction.reply({ embeds: [keyEmbed] });
            } catch (error) {
                console.error('Fehler beim Erstellen des Ordners:', error);
                await interaction.reply('Es ist ein Fehler beim Erstellen des Ordners aufgetreten.');
            }
        }
    }

}