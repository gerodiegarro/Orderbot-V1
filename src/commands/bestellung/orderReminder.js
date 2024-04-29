const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const prisma = require('../../../controller/prisma');
const  config  = require('../../../config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('order-reminder')
        .setDescription('Erinnert einen Benutzer an die Order')
        .addUserOption(option => option
            .setName('username')
            .setDescription('Der Benutzername des zu erinnernden Benutzers')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('orderid')
            .setDescription('Die Order-ID der Order')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const username = interaction.options.getUser('username');
        const orderId = interaction.options.getString('orderid');

        const findUserByOrderId = await prisma.orderSystem.findMany({
            where: {
                orderId: orderId
            }
        })

        if (findUserByOrderId.length === 0) {

            const embed = new EmbedBuilder()
                .setTitle('Keine Order Gefunden')
                .setDescription(`Die Order **(${orderId})** wurde nicht gefunden`)
                .setColor("Red")

            return (
                interaction.reply({ embeds: [embed], ephemeral: true })
            )
        }

        const produkt = findUserByOrderId[0].orderProdukt;
        const status = findUserByOrderId[0].orderStatus;


        const embed = new EmbedBuilder()
            .setTitle(`Erinnerung deine Order(${orderId}`)
            .setDescription(`Du hast folgendes bestellt **${produkt}**, dein Produkt status ist:  **${status}** `)
            .setColor(config.bot.allgemein[0].embedColor);

        await username.send({
            embeds: [embed]
        })

        const newEmbed = new EmbedBuilder()
            .setTitle('Erinnerung erfolgreich gesendet')
            .setDescription(`Der User **${username}** wurde erfolgreich erinnert`)
            .setColor(config.bot.allgemein[0].embedColor)
            
        await interaction.reply({ embeds: [newEmbed], ephemeral: true })
    }
};
