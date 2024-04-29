const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const  config  = require('../../../config')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alle-kunden')
        .setDescription('Ist eine liste mit allen kunden und Informationen')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const allUsers = await prisma.createKunde.findMany({});


        const embed = new EmbedBuilder()
            .setTitle("Alle Kunden")
            .setDescription('Die Liste besteht aus allen Kunden und ihren Informationen')
            .setColor(config.bot.allgemein[0].embedColor)

        let userInfo = "";
        allUsers.forEach((user, index) => {
            userInfo += `Username: **${user.username}**\n`
            userInfo += `Kundennummer: ${user.kundenNummer}\n`;
            userInfo += `Email: ${user.email}\n\n`;
            
        });

        embed.addFields({ name: "Informationen\n", value: userInfo });

        await interaction.reply({ embeds: [embed] })
    }
}