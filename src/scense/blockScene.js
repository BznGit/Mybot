const fs = require('fs');
const users = require('../controls/users.json');
const monit = require('../controls/apiControls');
const settings = require('../../botSettings.json');
const monitor = new monit();
const {WizardScene, Scenes, Markup} = require("telegraf");
// Сцена создания нового матча.
const subscribe = new Scenes.WizardScene(
    "blockScene", // Имя сцены
    
    (ctx) => {
      ctx.reply('Выберите монету:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback ('Ethereum','chooseEth'),
          Markup.button.callback('Ergo', 'chooseErgo'),        
        ])    
      })
      
    }

);
  //Регистрация подписчика
  subscribe.action('subscrcribe', (ctx)=>{
    let curUser = {
      userId : ctx.chat.id,
      poolId : ctx.wizard.state.poolId,
      wallet : null,
      worker : null,
      levelHash : null,
      defHash : null,
      block : true,
    };
    
    console.log('Added user: ', curUser);
    users.push(curUser);
    console.log("All users id: ", users); 
    fs.writeFileSync('./src/controls/users.json', JSON.stringify(users));
    ctx.reply('Вы подписались на оповещение о хешрейте');
    return ctx.scene.enter("homeScene")  
    
  });
  
  subscribe.action('chooseEth', (ctx)=>{
    ctx.wizard.state.poolId = 'ethpool';
    return ctx.reply('Подписка на оповещение о новом блоке:', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Подписаться', 'subscrcribe'),
        Markup.button.callback('Назад', 'back')
      ])
    })
   
  });
  
  subscribe.action('chooseErgo',  (ctx)=>{
    ctx.wizard.state.poolId = 'ergopool'
    return ctx.reply('Подписка на оповещение о новом блоке:', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Подписаться', 'subscrcribe'),
        Markup.button.callback('Назад', 'back')
      ])
    })
  });
    
  subscribe.action('back', (ctx)=> {
    ctx.scene.leave();
    ctx.scene.enter("homeScene")

      
  });



module.exports = subscribe;


   
