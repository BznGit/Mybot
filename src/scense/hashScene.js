const fs = require('fs');
const axios = require('axios');
const settings = require('../../botSettings.json');
const api = settings.MiningCoreApiEndpoints;

const chatIdes = require('../controls/chatId.json');
const monit = require('../controls/apiControls');
const monitor = new monit();
const { Scenes, Markup } = require("telegraf");

// Сцена создания нового матча.
const hashrate = new Scenes.WizardScene(
    "hashMenu", // Имя сцены
     (ctx) => {
      ctx.reply('Выберите монету:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback ('Ethereum','chooseEth'),
          Markup.button.callback('Ergo', 'chooseErgo'),        
        ])    
      })
      return ctx.wizard.next(); 
    },     
    (ctx) => {
       axios.get(api + '/api/pools/' + ctx.wizard.state.poolId + '/miners/' + ctx.message.text)
      .then((response)=> {
        // handle success
        console.log(response.data.performance);
        if (response.data.performance == undefined){
          ctx.reply('Такого кошелька нет!');
          ctx.reply('Введите кошелек заново');
          return
        }
        ctx.wizard.state.wallet =  ctx.message.text;
        let wrk= Object.keys(response.data.performance.workers);
        ctx.reply('Ваши воркеры: ' + wrk);
        ctx.reply('Выберите нужный в правом меню ⤵️', Markup.keyboard(wrk).oneTime().resize())
        ctx.replyWithPhoto({ source: './src/buttons.png' })
        return ctx.wizard.next();        
         
      }).catch(function (error) {
        // handle error
        console.log(error);
        ctx.reply('Ошибка проверки');
        return
      })
     
      
    }, 
    (ctx) => {

      ctx.wizard.state.worker =  ctx.message.text;
      ctx.reply('Выберите размерность граничного уровня хешрейта:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback('MH/s', 'chooseM'),
          Markup.button.callback('GH/s', 'chooseG'),
          Markup.button.callback('TH/s', 'chooseT'),        
        ])    
      })
      return ctx.wizard.next(); 
    },     

    (ctx) => {
      let regexp = /[0-9]/;
      if(!regexp.test(ctx.message.text)){
        ctx.reply('введите число!');
        return 
      } 
      ctx.wizard.state.hash =  ctx.message.text;
      
      ctx.reply('<b>Ваши данные:</b>\n'+ 
      'Монета: '  + ctx.wizard.state.poolId + '\n' +
      'Кошелек: ' + ctx.wizard.state.wallet + '\n' +
      'Воркер: '  + ctx.wizard.state.worker + '\n' +
      'Граничнй  уровень: '  + ctx.wizard.state.hash + ' ' + ctx.wizard.state.defHash, {parse_mode: 'HTML'});
      ctx.scene.enter("home") 
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

hashrate.action('chooseM',  (ctx)=>{
  ctx.wizard.state.defHash = 'MH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});
hashrate.action('chooseG',  (ctx)=>{
  ctx.wizard.state.defHash = 'GH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});
hashrate.action('chooseT',  (ctx)=>{
  ctx.wizard.state.defHash = 'TH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
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


   
