const fs = require('fs');
const chatIdes = require('../controls/chatId.json');
const monit = require('../controls/apiControls');
const settings = require('../../botSettings.json');
const monitor = new monit();
const {WizardScene, Scenes, Markup} = require("telegraf");
// Сцена создания нового матча.
const subscribe = new Scenes.WizardScene(
    "subscrMenu", // Имя сцены
    (ctx) => {
      return ctx.reply('Подписка на оповещение о новом блоке:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Подписаться', 'subscrcribe'),
          Markup.button.callback('Отписаться', 'unsubscribe'),
          Markup.button.callback('Назад', 'back')
        ])
      })
    }
);
  //Регистрация подписчика
  subscribe.action('subscrcribe', (ctx)=>{
    if (ctx.from.id != settings.adminId && ctx.chat.type =='group'){
      ctx.reply('У Вас недостаточно прав для выполнения этой команды');
      return; 
    }
    let id = ctx.chat.id;
    let index = chatIdes.indexOf(id);
    if (index ==-1){
      monitor.stop();
      console.log('Added:=> id: '+id +'-'+ ctx.chat.first_name);
      chatIdes.push(id);
      console.log("All users id: ", chatIdes); 
      fs.writeFileSync('src/controls/chatId.json', JSON.stringify(chatIdes));
      ctx.reply('Вы подписались на оповещение Ethсore pool bot');
      monitor.start();
                
    } 
      else ctx.reply('Вы уже подписаны на оповещение Ethсore pool bot');
      ctx.scene.leave();
    
  });
  //Удаление подписчика
  subscribe.action('unsubscribe', (ctx)=> {
    if (ctx.from.id != settings.adminId && ctx.chat.type =='group'){
      ctx.reply('У Вас недостаточно прав для выполнения этой команды');
      return; 
    }

    let id = ctx.chat.id;
    let index = chatIdes.indexOf(id);
    if (index !==-1){
        monitor.stop();
        console.log('deleted:=> id: '+id +'-'+ ctx.chat.first_name);
        chatIdes.splice(index, 1);
        console.log("All users id: ", chatIdes); 
        fs.writeFileSync('src/controls/chatId.json', JSON.stringify(chatIdes)); 
        ctx.reply('Вы отписались от оповещения Ethсore pool bot');
        monitor.start(); 
      } 
      else ctx.reply('Вы уже отписались от оповещения Ethсore pool bot'); 
      ctx.scene.leave();
      
  });
    
  subscribe.action('back', (ctx)=> {
    ctx.scene.leave();
    ctx.scene.enter("home")

      
  });



module.exports = subscribe;


   
