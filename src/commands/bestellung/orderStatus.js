const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
const  config  = require('../../../config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('change-orderstatus')
        .setDescription('change den Orderstatus')
        .addStringOption(
            option => option
                .setName('kundennummer')
                .setDescription('Die kundennummer vom Kunden')
                .setRequired(true)
        )
        .addStringOption(
            option => option
                .setName('orderid')
                .setDescription('Die orderID von der Bestellung')
                .setRequired(true)
        )
        .addStringOption(
            option => option
                .setName('orderstatus')
                .setDescription('wechselt den status der Order')
                .addChoices(
                    { name: 'Warten auf Bezahlung', value: 'Warten auf Bezahlung' },
                    { name: 'Angenommen', value: 'Angenommen' },
                    { name: 'In bearbeitung', value: 'In bearbeitung' },
                    { name: 'Fertigstellung', value: 'Fertigstellung' },
                    { name: 'Zustellung', value: 'Zustellung' },
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const orderId = interaction.options.getString('orderid')
        const orderStatus = interaction.options.getString('orderstatus')
        const kundenNummer = interaction.options.getString('kundennummer')

        const checkKundenNummer = await prisma.createKunde.findMany({
            where: {
                kundenNummer: kundenNummer
            }
        })

        if (checkKundenNummer.length === 0) {

            const embed = new EmbedBuilder()
                .setTitle('Kundennummer nicht gefunden')
                .setDescription(`Die kundennummer /wurde nicht gefunden`)
                .setColor(config.bot.allgemein[0].embedColor)

            return (
                interaction.reply({ embeds: [embed], ephemeral: true })
            )
        }
        const username = checkKundenNummer[0].username;

        const updateOrderStatus = await prisma.orderSystem.updateMany({
            where: {
                orderId: orderId
            },
            data: {
                orderStatus: orderStatus
            }

        })

        if (updateOrderStatus.length === 0) {

            const embed = new EmbedBuilder()
                .setTitle(`Keine Bestellung offen`)
                .setDescription(`${username} hat keine Bestellungen offen`)
                .setColor(config.bot.allgemein[0].embedColor)

            return (
                interaction.reply({ embeds: [embed], ephemeral: true })
            )
        }

        const embed = new EmbedBuilder()
            .setTitle('Order Status geändert!')
            .setColor(config.bot.allgemein[0].embedColor)
            .setDescription(`Die Order von **${username}** wurde erfolgreich auf **${orderStatus}** geändert`)

        await interaction.reply({ embeds: [embed] })
    }
}