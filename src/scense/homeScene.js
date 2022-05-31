const fs = require('fs');
const users = require('../storage/users.json');
const settings = require('../../botSettings.json');
const {WizardScene, Scenes, Markup} = require("telegraf");
const {logIt} = require('../libs/loger');
// Сцена создания нового матча.
const home = new Scenes.WizardScene(
  "homeSceneWizard", // Имя сцены
  (ctx)=>{
    let currUser = users.find(item=>item.userId == ctx.chat.id);
    if (currUser == undefined){
      try{
          return ctx.reply('Сейчас у Вас нет подписки на оповещение о появлении нового блока и падении текущего хешрейта воркеров', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            Markup.button.callback('Подписаться на оповещение', 'onSub'),    
          ])
      })
      }catch(err){
        console.log('Ошибка! HomeScene', err);
        logIt('Ошибка  homeScene.js 20 стр', err);
      }
      
    }
    else
    {
      let text='';
      let item = currUser.workers
      for(let i=0; i<item.length; i++){
        text += `${i+1}) «`+ `${item[i].name ==''? 'default': item[i].name}` +'» : ограничение - ' + item[i].hashLevel +' '+ item[i].hashDev + `, оповещение: «${item[i].delivered? 'отключено':'включено'}` + '»;\n'
      }
      try{
        ctx.reply('<u>Вы подписаны на оповещение с параметрами:</u>\n' +
          '<b>- монета: </b>'   + currUser.poolId  + ';\n' +
          '<b>- оповещение о новом блоке: </b>«'  + currUser.block + '»;\n' +
          '<b>- кошелек: </b>'  + currUser.wallet + ';\n' +
          '<b>- воркеры: </b>\n'  + text + 
                  
          'Выберите:',  {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [{ text: "Отписаться от оповещения", callback_data: "unSub" },{ text: "Изменить параметры оповещения", callback_data: "chengeSub" }],
                [{ text: "Назад", callback_data: "back" }], 
              ])
          });
                    
      }catch(err){
        console.log('Ошибка пользователя: ', err);
        logIt('Ошибка пользователя: homeScene.js 45 стр', err);
      }
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
home.action('back', (ctx)=>{
  ctx.scene.leave();
  ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
     { text: "Продолжить", callback_data: 'onStart' },    
      ])
  }) 
});
home.command('/back', (ctx) => {

  ctx.scene.leave();
  ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
     { text: "Продолжить", callback_data: 'onStart' },    
      ])
  })
})


module.exports = home;


   
