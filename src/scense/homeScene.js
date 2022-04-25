const fs = require('fs');
const chatIdes = require('../controls/chatId.json');
const {WizardScene, Scenes, Markup} = require("telegraf");
// Сцена создания нового матча.
const home = new Scenes.WizardScene(
    "home", // Имя сцены
    (ctx) => {
      return ctx.reply('Добро пожаловать в меню <b>Ethcore Poll bot</b>', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Подписка на блок', 'subscrMenu'),
          Markup.button.callback('Подпиcка на hashrate', 'hashMenu')
        ])
      })
    },
);
home.action('subscrMenu',(ctx) => ctx.scene.enter("subscrMenu"));
home.action('hashMenu',(ctx) => ctx.scene.enter("hashMenu"));

module.exports = home;


   
