const fs = require('fs');
const users = require('../controls/users.json');
const monit = require('../controls/apiControls');
const monitor = new monit();
const {WizardScene, Scenes, Markup} = require("telegraf");
// Сцена создания нового матча.
const home = new Scenes.WizardScene(
    "homeSceneWizard", // Имя сцены
    (ctx)=>{
      
      let currUser = users.find(item=>item.userId == ctx.chat.id);
     // console.log('Current user: ', currUser)
      if (currUser == undefined){
        return ctx.reply('Добро пожаловать в бот, который может Вас оповещать о появлении нового блока и падении текущего хешрейта:', {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
              Markup.button.callback('Подписаться на оповещение', 'onSub'),    
            ])
        }) 
      }
      else
      {
        ctx.reply('<b>Вы подписаны на оповещение с параметрами:</b>\n' +
          'Монета: '  + '<i>' + currUser.poolId + '</i>' + '\n' +
          'Кошелек: ' + '<i>' + currUser.wallet + '</i>' + '\n' +
          'Воркер: '  + '<i>' + currUser.worker + '</i>' + '\n' +
          'Оповещение об уровене хешрейта: ' + '<i>' + currUser.levelHash + ' ' + currUser.defHash + '</i>\n'+
          'Оповещение на новом блоке: ' + '<i>' + currUser.block + '</i>\n' +
          ',<b>Выберите:</b>',  {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                Markup.button.callback('Отписаться от оповещения', 'unSub'),
                Markup.button.callback('Изменить параметры оповещения', 'chengeSub'),
              ])
          });

     }   
});
  
 
home.action('onSub', (ctx)=>{
  ctx.scene.enter("subSceneWizard")  
});
home.action('unSub', (ctx)=>{
  ctx.scene.enter("unSubSceneWizard")  
});
home.action('chengeSub', (ctx)=>{
  ctx.scene.enter("chengeSubSceneWizard")  
});


module.exports = home;


   
