const fs = require('fs');
const axios = require('axios');
const settings = require('../../botSettings.json');
const api = settings.MiningCoreApiEndpoints;
const users = require('../controls/users.json');
const { Scenes, Markup } = require("telegraf");

// Сцена создания нового матча.
const subscribe = new Scenes.WizardScene(
    "subSceneWizard", // Имя сцены
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
        ctx.reply('Выберите нужный в правом меню ➰', Markup.keyboard(wrk).oneTime().resize())
        return ctx.wizard.next();        
         
      }).catch(function (error) {
        // handle error
        console.log(error);
        ctx.reply('Введены неверные данные попробуйте еще раз!');
        return
      })    
    }, 
    (ctx) => {
      ctx.wizard.state.worker = {
        name: ctx.message.text,
        hashLevel: null,
        hashDev: null,
        delivered: false
      }
      ctx.reply('Выберите размерность граничного уровня хешрейта:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
        [{ text: "KH/s", callback_data: "chooseK" }, { text: "MH/s", callback_data: "chooseM" },{ text: "GH/s", callback_data: "chooseG" }],
        [{ text: "TH/s", callback_data: "chooseT" }, { text: "PH/s", callback_data: "chooseP" }],      
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
      ctx.wizard.state.worker.hashLevel =  ctx.message.text;
      ctx.wizard.state.worker.delivered = false;
      ctx.reply('<b>Ваши данные:</b>\n'+ 
        'Монета: '  + ctx.wizard.state.poolId + '\n' +
        'Оповещение о новом блоке: '  + ctx.wizard.state.block + '\n' +
        'Кошелек: ' + ctx.wizard.state.wallet + '\n' +
        'Воркер: '  + ctx.wizard.state.worker.name + '\n' +
        'Оповещение об уровене хешрейта: '  + ctx.wizard.state.worker.hashLevel + ' ' + ctx.wizard.state.worker.hashDev,
        {parse_mode: 'HTML'}
      ).then(
        ctx.reply('Подписаться?', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Да', 'subHash'),
          Markup.button.callback('Нет', 'back')
        ])
      })
      )      
    }, 
);
subscribe.action('chooseEth', (ctx)=>{
  ctx.wizard.state.poolId = 'ethpool';
  ctx.reply('Подписаться на оповещение о новом блоке ethereum?', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('Да', 'subBlockEth'),
      Markup.button.callback('Нет', 'notSubBlockEth')
    ])
  }) 
});

subscribe.action('subBlockEth',  (ctx)=>{
  ctx.wizard.state.block = 'да'
  ctx.reply('Введите ethereum кошелек:');
});

subscribe.action('notSubBlockEth',  (ctx)=>{
  ctx.wizard.state.block = 'нет'
  ctx.reply('Введите ethereum кошелек:');
});

subscribe.action('chooseErgo',  (ctx)=>{
  ctx.wizard.state.poolId = 'ergopool'
  ctx.reply('Подписаться на оповещение о новом блоке ergo?', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      { text: "Да'", callback_data: 'subBlockErgo' }, 
      { text: "Нет", callback_data: 'notSubBlockErgo' }
    ])
  }) 
});

subscribe.action('subBlockErgo',  (ctx)=>{
  ctx.wizard.state.block = 'да'
  ctx.reply('Введите ergo кошелек:');
});

subscribe.action('notSubBlockErgo',  (ctx)=>{
  ctx.wizard.state.block = 'нет'
  ctx.reply('Введите ergo кошелек:');
});

subscribe.action('chooseK',  (ctx)=>{
  ctx.wizard.state.worker.hashDev = 'KH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});
subscribe.action('chooseM',  (ctx)=>{
  ctx.wizard.state.worker.hashDev = 'MH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});
subscribe.action('chooseG',  (ctx)=>{
  ctx.wizard.state.worker.hashDev = 'GH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});
subscribe.action('chooseT',  (ctx)=>{
  ctx.wizard.state.worker.hashDev = 'TH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});
subscribe.action('chooseP',  (ctx)=>{
  ctx.wizard.state.worker.hashDev = 'PH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});

subscribe.action('setHash', (ctx)=>{
  return ctx.reply('Введите пороговый уровень хешрейта:', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('Далее', 'subscrcribeHash'),
      Markup.button.callback('Отписаться', 'unsubscribeHash'),
      Markup.button.callback('Назад', 'back')
    ])
  })
});

subscribe.action('subHash', (ctx)=>{
  let curUser = {
    userId: ctx.chat.id,
    poolId : ctx.wizard.state.poolId,
    wallet : ctx.wizard.state.wallet,
    block : ctx.wizard.state.block, 
    workers : [ctx.wizard.state.worker],

  };
  
  console.log('Added user: ', curUser);
  users.push(curUser);
  console.log("All users id: ", users); 
  fs.writeFileSync('./src/controls/users.json', JSON.stringify(users));
  return ctx.scene.enter("homeSceneWizard")  

});
  
  
subscribe.action('back', (ctx)=> {
  ctx.scene.leave();
  ctx.scene.enter("homeSceneWizard")  
});

subscribe.command('/back', (ctx) => {
  ctx.scene.leave();
  ctx.scene.enter("homeSceneWizard");
  console.log('subScene exit');
})
  

module.exports = subscribe;


   
