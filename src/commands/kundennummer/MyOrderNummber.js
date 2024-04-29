const { SlashCommandBuilder } = require('@discordjs/builders');
const { PrismaClient } = require('@prisma/client');
const { EmbedBuilder } = require('discord.js');
const prisma = new PrismaClient();
const  config  = require('../../../config')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('kundennummer')
        .setDescription('Hier findest du deine Kundennummer'),

    async execute(interaction) {

        const user = interaction.user.username;

        const checkNumberExist = await prisma.createKunde.findMany({
            where: {
                username: user,
            },
        });

        const checkOrderID = await prisma.orderSystem.findMany({
            where: {
                username: user
            }
        });


        if (checkNumberExist.length === 0) {

            const embed = new EmbedBuilder()
                .setColor(config.bot.allgemein[0].embedColor)
                .setTitle('Du hast keine Kundennummer')
                .setDescription('Du erhälst erst eine Kundennummer wenn du bei uns Kunde bist, falls du Kunde bist und keine hast öffne ein Ticket');

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let allOrderIDs = '';
        let produkt = '';

        if (checkOrderID.length !== 0) {
            allOrderIDs = checkOrderID[0].orderId;
            produkt = checkOrderID[0].orderProdukt;
        }

        const kundenNummer = checkNumberExist[0].kundenNummer;
        const kundenEmail = checkNumberExist[0].email;
        const googleDriveLink = checkNumberExist[0].googleDriveLink

        const embed = new EmbedBuilder()
            .setTitle("Deine Kunden Informationen")
            .setDescription("Teile diese Informationen mit keinen Drittpersonen")
            .addFields({ name: "KundenNummer", value: '```' + kundenNummer + '```' })
            .addFields({ name: "Email", value: '```' + kundenEmail + '```' })
            .addFields({ name: "Orders", value: '```' + allOrderIDs + " - " + produkt + '```' })
            .addFields({ name: "Folder Link", value: '```' + googleDriveLink + '```' })
            .setColor(config.bot.allgemein[0].embedColor);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
