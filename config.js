const config = {}

config.bot = {

    nodeMailer: [
        {
            serviceEmail: '', // Deine Email - sollte dafür eine Gmail sein
            password: '' // App Password - Schau die die readme.md dazu an
        }
    ],

    bot: [
        {
            token: '', // Dein Discord Bot Token - Erstelle hier einen Bot - https://discord.com/developers/
            clientId: '', // Die Client ID von deinem Bot
            clientSecret: '', // Die Client Secret von deinem Bot
            guildId: '' // Die Server ID worauf sich der Bot befindet

        }
    ],

    allgemein: [
        {
            teamrolle: '', // Team Rollen ID die die Staff Commands ausführen dürfen
            embedColor: '', // Die Hex Color die bei jedem Embed sich befindet (mit # davor)
        }
    ],

    KundenSystem: [
        {
            kundenRolle: '', // Die Rolle die der Benutzer bekommt wenn seine Kundennummer erstell wird
        }
    ],
}

module.exports = config
