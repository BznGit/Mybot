const fs = require('fs');
const chatIdes = require('../controls/users.json');
const monit = require('../controls/apiControls');
const monitor = new monit();
const {WizardScene, Scenes, Markup} = require("telegraf");

// Сцена создания нового матча.
const home = new Scenes.WizardScene(
    "homeScene", // Имя сцены
    (ctx) => {
      return ctx.reply('Подписка на оповещение о появлении нового блока и падении текущего хешрейта:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Подписаться на блок', 'block'),
          Markup.button.callback('Подписаться на хешрейт', 'hash'),
          ])
      })
    }
);

home.action('hash', (ctx)=>{
  ctx.scene.enter("hashScene")  
});
home.action('block', (ctx)=>{
  ctx.scene.enter("blockScene")  
});

  

module.exports = home;


   
