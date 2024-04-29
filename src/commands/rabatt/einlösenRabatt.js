const { SlashCommandBuilder } = require('@discordjs/builders');
const { PrismaClient } = require('@prisma/client');
const { EmbedBuilder } = require('discord.js');
const prisma = new PrismaClient()
const  config  = require('../../../config')



module.exports = {
    data: new SlashCommandBuilder()
        .setName('rabatt-einlösen')
        .addStringOption(option => option
            .setName('rabatt-code')
            .setDescription('rabatt name')
            .setRequired(true)
        )
        .setDescription('hier kansnt du dein Rabatt code einlösen'),

    async execute(interaction) {

        const getUser = interaction.user
        const userRabattCode = interaction.options.getString('rabatt-code')

        const checkKundenNummer = await prisma.createKunde.findMany({
            where: {
                username: getUser.name
            }
        })

        const checkRabatt = await prisma.rabattCodes.findMany({
            where: {
                name: userRabattCode
            }
        })

        if (checkKundenNummer.length === 0) {
            return (
                interaction.reply({ content: 'Du hast keine Kundenummer, du brauchst eine um Rabattcodes einzulösen', ephemeral: true })
            )
        }

        if (checkRabatt.length === 0) {
            return (
                interaction.reply({ content: 'Der Rabatt code ist falsch oder du hast dich vertippt', ephemeral: true })
            )
        }

        const member = await interaction.guild.members.fetch(getUser.id);
        const getUserRole = member.roles.cache.map(role => role.name);
        const checkRole = checkRabatt[0].rolle;
        const userName = interaction.user.username

        const prozent = checkRabatt[0].prozent;
        const erforderlicheRolle = checkRole

        if (userRabattCode === "-") {
            return (
                interaction.reply({ content: 'Dies ist kein Gültiger Rabattcode', ephemeral: true })
            )
        }

        if (!getUserRole.includes(erforderlicheRolle)) {
            return interaction.reply({ content: 'Du hast nicht die erforderliche Rolle, um diesen Code einzulösen', ephemeral: true });
        }

        const checkUserUsedRabattCode = await prisma.checkrabattcodeuses.findFirst({
            where: {
                rabattName: userRabattCode,
                username: userName
            }
        });

        if (checkUserUsedRabattCode) {
            return interaction.reply({ content: 'Du hast diesen Rabattcode bereits eingelöst', ephemeral: true });
        }

        const deleteUserRabattCode = await prisma.checkrabattcodeuses.create({
            data: {
                rabattName: userRabattCode,
                username: userName
            }
        });

        const embed = new EmbedBuilder()
            .setTitle('Rabattcode Erfolgreich')
            .setColor(config.bot.allgemein[0].embedColor)
            .setDescription(`Du hast erfolgreich den Rabattcode **${userRabattCode}** eingelöst und erhältst **${prozent}** Rabatt auf deinen Einkauf.`);

        await interaction.reply({ embeds: [embed] });


    }
}