const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { google } = require('googleapis');
const apikeys = require('../../../apiKey.json');
const  config  = require('../../../config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-order')
        .setDescription('erstellt eine Order')
        .addStringOption(
            option => option
                .setName('kundennummer')
                .setDescription('wähle die Kundenummer vom kunden aus')
                .setRequired(true)
        )
        .addStringOption(
            option => option
                .setName('produkt')
                .setDescription('Welches Produkt der Kunde erworben hat')
                .setRequired(true)
        )
        .addStringOption(
            option => option
                .setName('ordertyp')
                .setDescription('wähle den typ der order aus')
                .addChoices(
                    { name: 'Design', value: 'design' },
                    { name: 'Scripts', value: 'scripts' },
                    { name: 'Web', value: 'Web' },
                    { name: 'Custom', value: 'custom' }
                )
                .setRequired(true)
        )
        .addNumberOption(
            option => option
                .setName('preis')
                .setDescription('der preis des produktes')
                .setRequired(true)
        )
        .addStringOption(
            option => option
                .setName('rabatt')
                .setDescription('hat der kunde rabatt ?')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const generateKundenKey = () => {
            var length = 5,
                charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                retVal = "";
            for (var i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            return retVal;
        }

        const orderId = generateKundenKey()
        const orderStatus = "warten auf Bestätigung" || changeStatus
        const kundenNummerInput = interaction.options.getString('kundennummer');
        const ordertyp = interaction.options.getString('ordertyp');
        const produkt = interaction.options.getString('produkt');
        const rabatt = interaction.options.getString('rabatt');
        const preis = interaction.options.getNumber('preis');

        const checkRabatt = await prisma.rabattCodes.findMany({
            where: {
                name: rabatt
            }
        });



        if (checkRabatt.length === 0) {
            return (
                interaction.reply({ content: 'Rabattcode nicht gefunden', ephemeral: true })
            )
        };
        const rabattProzent = checkRabatt[0].prozent

        const rechenPreis = preis / 100 * rabattProzent

        const endPreis = preis - rechenPreis


        const checkKundenNummer = await prisma.createKunde.findMany({
            where: {
                kundenNummer: kundenNummerInput
            }
        });

        if (checkKundenNummer.length === 0) {
            return (
                interaction.reply({ content: "Kundenummer wurde nicht gefunden", ephemeral: true })
            )
        }

        const newOrder = await prisma.orderSystem.create({
            data: {
                kundenNummer: checkKundenNummer[0].kundenNummer,
                email: checkKundenNummer[0].email,
                username: checkKundenNummer[0].username,
                orderType: ordertyp,
                orderProdukt: produkt,
                preis: preis,
                orderStatus: orderStatus,
                orderId: orderId,
            }
        })



        const embed = new EmbedBuilder()
            .setTitle('Bestellung erstellt!')
            .setDescription('Deine Bestellung wurde erfolgreich erstellt.')
            .setColor(config.bot.allgemein[0].embedColor)
            .addFields(
                { name: "Informationen", value: `Deine OrderID ||${orderId}||`, inline: true },
                { name: "Du hast folgendes bestellt", value: `${produkt}`, inline: true },
                { name: 'Preis', value: `Deine Bestellung kostet **${endPreis}* EUR**` }, 
                { name: "Command", value: `Mit \`/my-orders\` kannst du deine Bestellung anhand der OrderId verfolgen.` }
            );

        await interaction.reply({ embeds: [embed] })
    }
}