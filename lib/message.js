const moment = require('moment');

function formatMessage(name, text) {
    return {
        name: name,
        text: text,
        time: moment().format('h:mm a')
    }
}

module.exports = formatMessage;