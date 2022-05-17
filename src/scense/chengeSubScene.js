const fs = require('fs');
const axios = require('axios');
const settings = require('../../botSettings.json');
const api = settings.MiningCoreApiEndpoints;
const users = require('../controls/users.json');
const { Scenes, Markup } = require("telegraf");

// Сцена создания нового матча.
const chengeSubscribe = new Scenes.WizardScene(
    "chengeSubSceneWizard", // Имя сцены
    // step #0
    (ctx)=>{
      let  curUser = users.find(item=>item.userId == ctx.chat.id)

      ctx.wizard.state.poolId  = curUser.poolId; 
      ctx.wizard.state.wallet  = curUser.wallet;
      ctx.wizard.state.worker  = curUser.worker ;
      ctx.wizard.state.hash    = curUser.levelHash;
      ctx.wizard.state.defHash = curUser.defHash ;
      ctx.wizard.state.block   = curUser.block ;
     
      ctx.reply('Выберите параметр, который необходимо изменить:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback ('Монета','chooseCoin'),
          Markup.button.callback('Оповещение о облоке', 'chooseblock'), 
          Markup.button.callback('Кошелек', 'chooseWallet'), 
          Markup.button.callback ('Воркер','chooseWorker'),
          Markup.button.callback('Уровень хешрейта', 'chooseHash'), 
               
        ]) 
      })  
    },
    // step #1
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
    // step #2
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
    // step #3
    (ctx) => {
      ctx.wizard.state.worker = [];
      let worker = {
        id: ctx.message.text,
        hashLevel: null,
        hashDev: null,
        delivered: false
      }
      ctx.wizard.state.workers.push(worker);
      ctx.reply(ctx.wizard.state.worker)
      if (ctx.wizard.state.worker==undefined) ctx.wizard.state.worker =  ctx.message.text;
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
    // step #4      
    (ctx) => {
      let regexp = /[0-9]/;
      if(!regexp.test(ctx.message.text)){
        ctx.reply('введите число!');
        return 
      } 
      ctx.wizard.state.hash =  ctx.message.text;
      ctx.wizard.state.delivered = false;
      
      ctx.reply('<b>Ваши новые данные:</b>\n'+ 
        'Монета: '  + '<i>' + ctx.wizard.state.poolId + '</i>'+ '\n' +
        'Оповещение о новом блоке: ' + '<i>'  +ctx.wizard.state.block + '</i>' + '\n' +
        'Кошелек: ' + '<i>' + ctx.wizard.state.wallet + '</i>' + '\n' +
        'Воркер: '  + '<i>' + ctx.wizard.state.worker + '</i>' + '\n' +
        'Оповещение об уровене хешрейта: '  + '<i>'  + ctx.wizard.state.hash + ' ' + ctx.wizard.state.defHash + '</i>',
        {parse_mode: 'HTML'}
      ).then(
         ctx.reply('Подписаться?', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Да', 'subHash'),
          Markup.button.callback('Нет', 'back')
        ])
      }) 
      );
       
    }, 
);

chengeSubscribe.action('chooseCoin',  (ctx)=>{
  ctx.wizard.steps[1](ctx);
  console.log('cursor: ', ctx.wizard.cursor);
});

chengeSubscribe.action('chooseWallet',  (ctx)=>{
  ctx.reply('Введите кошелек:')
  ctx.wizard.selectStep(2);
  console.log('cursor: ', ctx.wizard.cursor);
});

chengeSubscribe.action('chooseWorker',  (ctx)=>{
  axios.get(api + '/api/pools/' + ctx.wizard.state.poolId + '/miners/' + ctx.wizard.state.wallet)
  .then((response)=> {
    // handle success
    console.log(response.data.performance);
    if (response.data.performance == undefined){
      ctx.reply('Такого кошелька нет!');
      ctx.reply('Введите кошелек заново');
      return
    }
    ctx.wizard.selectStep(2);
    console.log('cursor: ', ctx.wizard.cursor);
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
});

chengeSubscribe.action('chooseHash',  (ctx)=>{

  ctx.wizard.steps[3](ctx);
  ctx.wizard.selectStep(4);
  console.log('cursor: ', ctx.wizard.cursor);
});

chengeSubscribe.action('chooseblock',  (ctx)=>{
  if (ctx.wizard.state.block =='нет'){
    ctx.wizard.state.block ='да'
      ctx.reply('Оповещение о новом блоке', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          Markup.button.callback('Подписаться', 'subHash'),
       
        ])
     }) 
  } else{
    ctx.wizard.state.block ='нет'
    ctx.reply('Оповещение о новом блоке', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.callback('Отписаться', 'subHash'),

      ])
   }) 
  } 
});


chengeSubscribe.action('chooseEth', (ctx)=>{
  ctx.wizard.state.poolId = 'ethpool';
  ctx.reply('Подписаться на оповещение о новом блоке ethereum?', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('Да', 'subBlockEth'),
      Markup.button.callback('Нет', 'notSubBlockEth')
    ])
  }) 
  
});

chengeSubscribe.action('subBlockEth',  (ctx)=>{
  ctx.wizard.state.block = 'да'
  ctx.reply('Введите ethereum кошелек:');
});

chengeSubscribe.action('notSubBlockEth',  (ctx)=>{
  ctx.wizard.state.block = 'нет'
  ctx.reply('Введите ethereum кошелек:');
});

chengeSubscribe.action('chooseErgo',  (ctx)=>{
  ctx.wizard.state.poolId = 'ergopool'
  ctx.reply('Подписаться на оповещение о новом блоке ethereum?', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('Да', 'subBlockErgo'),
      Markup.button.callback('Нет', 'notSubBlockErgo')
    ])
  }) 
});

chengeSubscribe.action('subBlockErgo',  (ctx)=>{
  ctx.wizard.state.block = 'да'
  ctx.reply('Введите ergo кошелек:');
});

chengeSubscribe.action('notSubBlockErgo',  (ctx)=>{
  ctx.wizard.state.block = 'нет'
  ctx.reply('Введите ergo кошелек:');
});

chengeSubscribe.action('chooseM',  (ctx)=>{
  ctx.wizard.state.defHash = 'MH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});
chengeSubscribe.action('chooseG',  (ctx)=>{
  ctx.wizard.state.defHash = 'GH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});
chengeSubscribe.action('chooseT',  (ctx)=>{
  ctx.wizard.state.defHash = 'TH/s'
  ctx.reply('Введите значение критического уровня хашрейта:');
});

chengeSubscribe.action('setHash', (ctx)=>{
  return ctx.reply('Введите пороговый уровень хешрейта:', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('Далее', 'subscrcribeHash'),
      Markup.button.callback('Отписаться', 'unsubscribeHash'),
      Markup.button.callback('Назад', 'back')
    ])
  })
});

chengeSubscribe.action('subHash', async(ctx)=>{
  
  let newUser = {
    userId: ctx.chat.id,
    poolId : ctx.wizard.state.poolId,
    wallet : ctx.wizard.state.wallet,
    worker : ctx.wizard.state.worker,
    levelHash : ctx.wizard.state.hash,
    defHash : ctx.wizard.state.defHash,
    block : ctx.wizard.state.block, 
    delivered: ctx.wizard.state.delivered,
  };
  
  let index = users.findIndex(item=>item.userId == ctx.chat.id);
  console.log('index=>',index)
  if (index != -1){
    users.splice(index, index+1);
    users.push(newUser);
    console.log('User chenged: ', newUser);
    console.log('All current users: ', users);
    fs.writeFileSync('./src/controls/users.json', JSON.stringify(users));
   await  ctx.reply('Ваши данные изменены!');
   ctx.scene.enter("homeSceneWizard")  
  }

});
  
  
chengeSubscribe.action('back', (ctx)=> {
  ctx.scene.leave();
  ctx.scene.enter("homeSceneWizard")  
});

chengeSubscribe.command('/back', (ctx) => {
  ctx.scene.leave();
  ctx.scene.enter("homeSceneWizard");
  console.log('chengeSubScene exit');
})
  

module.exports = chengeSubscribe;


   
