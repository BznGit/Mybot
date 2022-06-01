const fs = require('fs');
const users = require('../storage/users.json');
const settings = require('../../botSettings.json');
const {WizardScene, Scenes, Markup} = require("telegraf");
const {logIt} = require('../libs/loger');
// Сцена создания нового матча.
const unSubscribe = new Scenes.WizardScene(
    "unSubSceneWizard", // Имя сцены
  
    (ctx) => {
      ctx.reply('Вы действительно хотие полностью отписатья от поповещения!', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback ('Да','chooseUnSub'),
          Markup.button.callback('Нет', 'back'),        
        ])    
      })
    }
);
  //Регистрация подписчика
  unSubscribe.action('chooseUnSub', (ctx)=>{
    let  delUser = users.find(item=>item.userId == ctx.chat.id)
    let index = users.findIndex(item=>item.userId == ctx.chat.id);
   // console.log('index=>',index)
    if (index != -1){
      users.splice(index, index+1);
     // console.log('User deleted: ', delUser);
     // console.log('All current users: ', users);
      try{
        fs.writeFileSync('./src/storage/users.json', JSON.stringify(users));
        console.log('Removed user: Id -> ', delUser.userId);
        logIt('Removed user: Id -> ', delUser.userId);
        console.log('Total Users: ', users.length);
        logIt('Total Users: ', users.length);
        ctx.reply('Вы отписались от всех оповещений!')
        ctx.scene.leave();
        ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
         { text: "Продолжить", callback_data: 'onStart' },    
          ])
      })
      }catch(err){
        console.log('rror writing user deletion information to file: ', err);
        logIt('rror writing user deletion information to file: ', err);
      }
      ctx.scene.leave();
      ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
       { text: "Продолжить", callback_data: 'onStart' },    
        ])
    })
    }
  });
   
  unSubscribe.action('back', (ctx)=> {
    ctx.scene.leave();
    ctx.scene.enter("homeSceneWizard");
  });

  unSubscribe.command('/back', (ctx) => {
    ctx.scene.leave();
    ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
     { text: "Продолжить", callback_data: 'onStart' },    
      ])
  })
  })

module.exports = unSubscribe;


   
