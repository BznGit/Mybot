const fs = require('fs');
const users = require('../storage/users.json');
const settings = require('../../botSettings.json');
const {WizardScene, Scenes, Markup} = require("telegraf");
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
  unSubscribe.action('chooseUnSub', async(ctx)=>{
    let  delUser = users.find(item=>item.userId == ctx.chat.id)
    let index = users.findIndex(item=>item.userId == ctx.chat.id);
    console.log('index=>',index)
    if (index != -1){
      users.splice(index, index+1);
      console.log('User deleted: ', delUser);
      console.log('All current users: ', users);
      fs.writeFileSync('./src/storage/users.json', JSON.stringify(users));
      await ctx.reply('Вы отписались от всех оповещений!');
      return ctx.scene.enter("homeSceneWizard")  
    }
  });
   
  unSubscribe.action('back', (ctx)=> {
    ctx.scene.leave();
    ctx.scene.enter("homeSceneWizard");
    console.log('unSubScene exit'); 
  });

module.exports = unSubscribe;


   
