const fs = require('fs');
const chatIdes = require('../controls/users.json');
const monit = require('../controls/apiControls');
const monitor = new monit();
const {WizardScene, Scenes, Markup} = require("telegraf");
const users = require('../controls/users.json');
// Сцена создания нового матча.
const home = new Scenes.WizardScene(
    "homeScene", // Имя сцены
    (ctx)=>{
      let currUser = users.find(item=>item.userId == ctx.chat.id);
      console.log('Current user: ', currUser)
      if (currUser == undefined){
        return ctx.reply('Подписка на оповещение о появлении нового блока и падении текущего хешрейта:', {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            Markup.button.callback('Подписаться на блок', 'onBlock'),
            Markup.button.callback('Подписаться на хешрейт', 'onHash'),
            ])
        }) 
      }
      else
      {
        ctx.reply('<b>Вы подписаны на оповещение с параметрами:</b>\n' +
                  'Монета: '  + '<i>' + currUser.poolId + '</i>' + '\n' +
                  'Кошелек: ' + '<i>' + currUser.wallet + '</i>' + '\n' +
                  'Воркер: '  + '<i>' + currUser.worker + '</i>' + '\n' +
                  'Оповещение на уровень хешрейта: ' + '<i>' + currUser.levelHash + ' ' + currUser.defHash + '</i>',
        {parse_mode: 'HTML'});

        if (currUser.levelHash == null && currUser.block == true){
          return ctx.reply('Выберите:', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                Markup.button.callback('Отписаться от оповещения о блоке', 'offBlock'),
                Markup.button.callback('Подтписаться на оповещения о хешрейте', 'onHash'),
            ])
          })
        };
        if (currUser.levelHash !== null && currUser.block !== true){
          return ctx.reply('Выберите:', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                Markup.button.callback('Подтписаться на оповещение о блоке', 'onBlock'),
                Markup.button.callback('Отписаться от оповещения о хешрейте', 'offHash'),
              ])
          })
        };
        if (currUser.levelHash !== null && currUser.block == true){
          return ctx.reply('Выберите:', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                Markup.button.callback('Отписаться от оповещения о блоке', 'offBlock'),
                Markup.button.callback('Отписаться от оповещения о хешрейте', 'offHash'),
              ])
          })
        };  
     }   
});
      
 

home.action('onHash', (ctx)=>{
  ctx.scene.enter("hashScene")  
});
home.action('onBlock', (ctx)=>{
  ctx.scene.enter("blockScene")  
});
home.action('offHash', (ctx)=>{
  ctx.scene.enter("offHashScene")  
});
home.action('offBlock', (ctx)=>{
  ctx.scene.enter("offBlockScene")  
});
home.command('/back', (ctx) => ctx.scene.enter("homeScene"))
  

module.exports = home;


   
