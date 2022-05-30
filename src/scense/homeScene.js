const fs = require('fs');
const users = require('../storage/users.json');
const {WizardScene, Scenes, Markup} = require("telegraf");
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
      }catch(err){console.log('Ошибка! HomeScene',err)}
      
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
        console.log('Ошибка пользователя: ', err)
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
  ctx.reply('Добро пожаловать в чат-бот поддержки пользователей\n'+
  '<b>ETHCORE MINING POOL</b>\n'+
  ' Для начала работы с ботом нажмите «Продолжить»', 
  {parse_mode: 'HTML',
   ...Markup.inlineKeyboard([
        Markup.button.callback('Продолжить', 'onStart'),    
      ])
  })  
});
home.command('/back', (ctx) => {

  ctx.scene.leave();
  ctx.reply('Добро пожаловать в чат-бот поддержки пользователей\n'+
  '<b>ETHCORE MINING POOL</b>\n'+
  ' Для начала работы с ботом нажмите «Продолжить»', 
  {parse_mode: 'HTML',
   ...Markup.inlineKeyboard([
        Markup.button.callback('Продолжить', 'onStart'),    
      ])
  })
})


module.exports = home;


   
