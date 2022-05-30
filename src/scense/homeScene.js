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
          ctx.reply('<b>Вы подписаны на оповещение с параметрами:</b>\n' +
            'Монета: '  + '<i>' + currUser.poolId + '</i>' + '\n' +
            'Оповещение о новом блоке: ' + '<i>' + currUser.block + '</i>\n' +
            'Кошелек: ' + '<i>' + currUser.wallet + '</i>' + ',\n' +
            'Воркеры: \n'  + text + 
                    
            '<b>Выберите:</b>',  {
              parse_mode: 'HTML',
              ...Markup.inlineKeyboard([
                  Markup.button.callback('Отписаться от оповещения', 'unSub'),
                  Markup.button.callback('Изменить параметры оповещения', 'chengeSub'),
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
home.command('/back', (ctx) => {

  ctx.scene.leave();
  
  //ctx.scene.enter("homeSceneWizard");
  //console.log('subScene exit');
})


module.exports = home;


   
