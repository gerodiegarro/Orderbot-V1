

const config = {}

config.bot = {

    nodeMailer: [
        {
            serviceEmail: '', //Your Gmail adress
            password: '' //app password
        }
    ],

    bot: [
        {
            token: '',
            clientId: '',
            guildId: '',
            clientSecret: ''
        }
    ],

    allgemein: [
        {
            teamrolle: '',
            embedColor: '', //The Color of all Embeds
        }
    ],

    KundenSystem: [
        {
            kundenRolle: '', //Customer role
        }
    ],
}

module.exports = config

