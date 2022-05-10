const fs = require('fs');
const chatIdes = require('../controls/chatId.json');
const monit = require('../controls/apiControls');
const monitor = new monit();
const { Scenes, Markup } = require("telegraf");

// Сцена создания нового матча.
const hashrate = new Scenes.WizardScene(
    "hashMenu", // Имя сцены
     (ctx) => {
      ctx.reply('Введите пороговый уровень хешрейта:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback ('Ethereum','chooseEth'),
          Markup.button.callback('Ergo', 'chooseErgo'),        
        ])    
      })
      return ctx.wizard.next(); 
    },     
    (ctx) => {
      ctx.wizard.state.wallet =  ctx.message.text;
      ctx.reply('Введите воркер:');
      return ctx.wizard.next(); 
    }, 
    (ctx) => {
      ctx.wizard.state.worker =  ctx.message.text;
      ctx.reply('Ваши данные:\n'+ 
      'Монета:' + ctx.wizard.state.poolId+'\n'+
      'Кошелек:' + ctx.wizard.state.wallet+'\n'+
      'Воркер:' + ctx.wizard.state.worker+'\n');
      return ctx.wizard.leave();
    }, 

   
);
hashrate.action('chooseEth', (ctx)=>{
  ctx.wizard.state.poolId = 'ethpool'
  ctx.reply('Введите кошелек:'); 
});

hashrate.action('chooseErgo',  (ctx)=>{
  ctx.wizard.state.poolId = 'ergopool'
  ctx.reply('Введите кошелек:');
 
});


hashrate.action('setHash', (ctx)=>{
  return ctx.reply('Введите пороговый уровень хешрейта:', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('Далее', 'subscrcribeHash'),
      Markup.button.callback('Отписаться', 'unsubscribeHash'),
      Markup.button.callback('Назад', 'back')
    ])
  })
});

hashrate.action('subscrcribeHash', (ctx)=>{
  ctx.reply('Введите пороговый уровень хешрейта: ')
  let id = ctx.chat.id;
  let index = chatIdes.indexOf(id);
  if (index ==-1){
    monitor.stop();
    console.log('Added:=> id: '+id +'-'+ ctx.chat.first_name);
    chatIdes.push(id);
    console.log("All users id: ", chatIdes); 
    fs.writeFileSync('src\controls\chatId.json', JSON.stringify(chatIdes));
    ctx.reply('Вы подписались на оповещение Ethсore pool bot');
    monitor.start();
  } 
    else ctx.reply('Вы уже подписаны на оповещение Ethсore pool bot');
});
  
hashrate.action('unsubscribe', (ctx)=> {
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
});
  
hashrate.action('back', (ctx)=> {
  ctx.scene.leave();
  ctx.scene.enter("home")  
});

module.exports = hashrate;


   
