const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql');

const bot = new TelegramBot("6345622919:-fKux-gkk", {
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
})
const client = mysql.createPool({
    connectionLimit: 50,
    host: "localhost",
    user: "",
    database: "",
    password: ""
});

bot.on('message', async msg => {

    let chat_id = msg.chat.id,
        text = msg.text ? msg.text : '',
        settings = await db('SELECT * FROM settings ORDER BY id DESC');

    if(text.toLowerCase() === '/start') {
        return bot.sendMessage(chat_id, `This is the official BullMoney Telegram bot. To link your Telegram account, enter the command shown at <a href="https://bullmoney.com/bonus">bullmoney.com/bonus</a>.`, {
            parse_mode: "HTML",
            disable_web_page_preview: true
        });
    }

    else if(text.toLowerCase().startsWith('/bind')) {
        let unique_id = text.split("/bind ")[1] ? text.split("/bind ")[1] : 'undefined';
        let user = await db(`SELECT * FROM users WHERE unique_id = '${unique_id}'`);
        let check = await db(`SELECT * FROM users WHERE tg_id = ${chat_id}`);
        let subs = await bot.getChatMember('@BullMoney', chat_id).catch((err) => {});

        if (!subs || subs.status == 'left' || subs.status == undefined) {
            return bot.sendMessage(chat_id, `You are not subscribed to the <a href="https://t.me/BullMoney">channel</a>!`, {
                parse_mode: "HTML",
                disable_web_page_preview: true
            });
        }
        if(user.length < 1) return bot.sendMessage(chat_id, 'We could not find this user', {
            parse_mode: "HTML"
        });
        if(check.length >= 1) return bot.sendMessage(chat_id, 'This account is already linked!');
        if(user[0].tg_bonus_use == 1) return bot.sendMessage(chat_id, 'User has already received the reward');

        await db(`UPDATE users SET tg_id = ${chat_id} WHERE unique_id = '${unique_id}'`);
        await db(`UPDATE users SET tg_id = ${chat_id} WHERE tg_bonus = '1'`);
        return bot.sendMessage(chat_id, `Your account has been successfully linked!`);
    }
});

function db(databaseQuery) {
    return new Promise(data => {
        client.query(databaseQuery, function (error, result) {
            if (error) {
                console.log(error);
                throw error;
            }
            try {
                data(result);

            } catch (error) {
                data({});
                throw error;
            }

        });

    });
    client.end()
}
