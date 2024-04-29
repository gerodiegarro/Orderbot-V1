const { SlashCommandBuilder } = require('@discordjs/builders');
const { PrismaClient } = require('@prisma/client');
const { EmbedBuilder } = require('discord.js');
const prisma = new PrismaClient()
const  config  = require('../../../config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('my-orders')
        .setDescription('listet alle deine derzeitigen bestellungen auf')
        .addStringOption(option => option
            .setName('orderid')
            .setDescription('Die Id deine Order die du bei der bestellung bekommen hast')
            .setRequired(true)
        ),


    async execute(interaction) {

        const orderId = interaction.options.getString('orderid')


        const checkOrderId = await prisma.orderSystem.findMany({
            where: {
                orderId: orderId
            }
        })

        if (checkOrderId.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`du hast keine Bestellung offen`)
                .setDescription(`Wir haben keine bestellung auf deine Kundenummer gefunden`)
                .setColor(config.bot.allgemein[0].embedColor)
            return (
                interaction.reply({ embeds: [embed], ephemeral: true })
            )
        }

        const orderStatus = checkOrderId[0].orderStatus;
        const orderProdukt = checkOrderId[0].orderProdukt;



        const embed = new EmbedBuilder()
            .setTitle(`Deine Order(${orderId})`)
            .setDescription('Hier findest du alle Informationen über deine Bestellung')
            .setColor(config.bot.allgemein[0].embedColor)
            .addFields({ name: 'Was hast du bestellt ?', value: '```' + orderProdukt + '```' })
            .addFields({ name: 'Information', value: '```' + orderStatus + '```' })

        await interaction.reply({ embeds: [embed], ephemeral: true })
    }
}
