const fs = require('fs');
const axios = require('axios');
const settings = require('../../botSettings.json');
const api = settings.MiningCoreApiEndpoints;
const users = require('../storage/users.json');
const { Scenes, Markup } = require("telegraf");
const {logIt} = require('../libs/loger');
// Сцена создания нового матча.
const chengeSubscribe = new Scenes.WizardScene(
    "chengeSubSceneWizard", // Имя сцены
    // step #0 --------------------------------------------------
    (ctx)=>{
 
      let  curUser = users.find(item=>item.userId == ctx.chat.id);
      let tempArr = JSON.parse(JSON.stringify(curUser.workers));

      ctx.wizard.state.poolId = curUser.poolId; 
      ctx.wizard.state.wallet = curUser.wallet;
      ctx.wizard.state.workers = tempArr;
      ctx.wizard.state.block  = curUser.block ;
     
      ctx.reply('Выберите параметр, который необходимо изменить:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [{ text: "Монета", callback_data: "chooseCoin" }, { text: "Кошелек", callback_data: "chooseWallet" },{ text: "Воркеры", callback_data: "chooseWorker" }],
          [{ text: "Оповещение о облоке", callback_data: "chooseblock" }],                
        ]) 
      })  
    },
    // step #1 ---------------------------------------------------
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
    // step #2 ---------------------------------------------------
    (ctx) => {
       axios.get(api + '/api/pools/' + ctx.wizard.state.poolId + '/miners/' + ctx.message.text)
      .then((response)=> {
        // handle success
        //console.log(response.data.performance);
        if (response.data.performance == undefined){
          ctx.reply('Этот кошелек неактуален или введен с ошибкой!');
          ctx.reply('Введите кошелек заново');
          return
        }
        ctx.wizard.state.wallet =  ctx.message.text;
        
        let wrk= Object.keys(response.data.performance.workers);
        ctx.wizard.state.tempWorkerNames = wrk;
        if (wrk[0]=='') wrk[0] = 'default';
        let text='';
        for(let i=0; i<wrk.length; i++){
          text += `${i+1}) «`+ `${wrk[i]}` +'»\n'
        }
        ctx.reply('Ваши актуальные воркеры:\n' + text);
        ctx.reply('Выберите нужный на выпадающей клавиатуре или наберите вручную:', Markup.keyboard(wrk).oneTime().resize())
        return ctx.wizard.next();        
         
      }).catch(function (error) {   
        console.log('Request error while updating wallet: ', error);
        logIt('Request error while updating wallet: ', error);
        ctx.reply('Введены неверные данные попробуйте еще раз!');
        return
      })    
    }, 
    // step #3 ------------------------------------------------------------
    (ctx) => {
      if (!ctx.wizard.state.tempWorkerNames.includes(ctx.message.text) && !ctx.wizard.state.stepError){
        ctx.reply(`Воркера «${ctx.message.text}» не существует!`);
        return 
      }
      let currWorkers = ctx.wizard.state.workers;
      let choosedWorker = ctx.message.text;
      //console.log('choosedWorker>',choosedWorker);
      //console.log('currWorkers>',currWorkers);
      let curWorkerIndex = currWorkers.findIndex(item=>item.name == choosedWorker);
     // console.log(' index>',curWorkerIndex)
      if (curWorkerIndex!=-1){
        ctx.wizard.state.curWorkerIndex = curWorkerIndex;
        //console.log('---->',ctx.wizard.state.curWorkerIndex);
 
      } else {
        
        let worker = {
          name: ctx.message.text,
          hashLevel: null,
          hashDev: null,
          delivered: false
        }
        
        ctx.wizard.state.tempWorker = worker;
        //console.log('---->', ctx.wizard.state.workers);
      }
      ctx.wizard.state.stepError = true;
      ctx.reply('Выберите размерность порогового уровня хешрейта:', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [{ text: "KH/s", callback_data: "chooseK" },{ text: "MH/s", callback_data: "chooseM" },{ text: "GH/s", callback_data: "chooseG" }],
          [{ text: "TH/s", callback_data: "chooseT" },{ text: "PH/s", callback_data: "chooseP" }],      
        ])
      })
      return ctx.wizard.next()
       
    },     
    // step #4 -------------------------------------------------   
    (ctx) => {
      
      if (ctx.wizard.state.stepError) {
        ctx.reply('Выберите кнопками выше!'); 
        ctx.wizard.state.stepError = true;
        return 
      } 
      let regexp = /^[0-9]+$/;
      if(!regexp.test(ctx.message.text)){
        ctx.reply('Введите число!');
        return 
      } 
      //Проверка на существующий воркер ----------------------------
      if (ctx.wizard.state.curWorkerIndex!=undefined){
        ctx.wizard.state.workers[ctx.wizard.state.curWorkerIndex].hashLevel = ctx.message.text;
        ctx.wizard.state.workers[ctx.wizard.state.curWorkerIndex].delivered = false;
        let text='';
        let item = ctx.wizard.state.workers;
   
        for(let i=0; i<item.length; i++){
          text += `${i+1}) «`+ item[i].name +'» : ограничение - ' + item[i].hashLevel +' '+ item[i].hashDev + `, оповещение: «${item[i].delivered? 'отключено':'включено'}` + '»;\n'
        }
        ctx.reply('<u>Ваши новые данные:</u>\n' +
          '<b>- монета: </b>'   + ctx.wizard.state.poolId +  ';\n' +
          '<b>- оповещение о новом блоке:</b> «'  + ctx.wizard.state.block + '»;\n' +
          '<b>- кошелек: </b>'  + ctx.wizard.state.wallet + ';\n' +
          '<b>- контролируемые воркеры:</b> \n'  + text + 
                  
          '<b>Выберите:</b>',  {
            parse_mode: 'HTML',
          }).then(
            ctx.reply('Подписаться?', {
              parse_mode: 'HTML',
              ...Markup.inlineKeyboard([
                { text: "Да", callback_data: "subHash" }, 
                { text: "Нет", callback_data: "back" }
              ])
            }) 
          );
      } else{
        //Проверка на несуществующий воркер ----------------------------
        ctx.wizard.state.tempWorker.hashLevel =  ctx.message.text;
        ctx.wizard.state.tempWorker.delivered = false;
        ctx.reply('<u>Ваши новые данные:</u>\n'+ 
          '<b>- монета: </b>' + ctx.wizard.state.poolId + ';\n' +
          '<b>- оповещение о новом блоке: </b>«'  +ctx.wizard.state.block  + '»;\n' +
          '<b>- кошелек: </b>' + ctx.wizard.state.wallet  + ';\n' +
          '<b>- воркер: </b>«' + ctx.wizard.state.tempWorker.name  + '»;\n' +
          '<b>- оповещение об уровене хешрейта: </b>'  + ctx.wizard.state.tempWorker.hashLevel + ' ' + ctx.wizard.state.tempWorker.hashDev,
          {parse_mode: 'HTML'}
        ).then(
          ctx.reply('Подписаться?', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              { text: "Да", callback_data: "subHash" }, 
              { text: "Нет", callback_data: "back" }
            ])
          }) 
        );
      }       
    }, 
);

chengeSubscribe.action('chooseCoin',  (ctx)=>{
  ctx.wizard.state.wallet = null;
  ctx.wizard.state.workers = [];
  ctx.wizard.steps[1](ctx);
  //console.log('cursor: ', ctx.wizard.cursor);
});

chengeSubscribe.action('chooseWallet',  (ctx)=>{
  ctx.wizard.state.wallet = null;
  ctx.wizard.state.workers = [];
  ctx.reply('Введите кошелек:')
  ctx.wizard.selectStep(2);
 // console.log('cursor: ', ctx.wizard.cursor);
});

chengeSubscribe.action('chooseWorker',  (ctx)=>{
  axios.get(api + '/api/pools/' + ctx.wizard.state.poolId + '/miners/' + ctx.wizard.state.wallet)
  .then((response)=> {
    // handle success
    //console.log(response.data.performance);
    if (response.data.performance == undefined){
      ctx.reply('Такого кошелька нет!');
      ctx.reply('Введите кошелек заново');
      return
    }
    ctx.wizard.selectStep(2);
    //console.log('cursor: ', ctx.wizard.cursor);
    let wrk= Object.keys(response.data.performance.workers);
    ctx.wizard.state.tempWorkerNames = wrk;
    let text='';
    for(let i=0; i<wrk.length; i++){
      text += `${i+1}) «`+ `${wrk[i]}` +'»\n'
    }
    ctx.reply('Ваши воркеры:\n' + text);
    ctx.reply('Выберите нужный на выпадающей клавиатуре или наберите вручную:',
      Markup.keyboard(wrk,{ wrap: (btn, index, currentRow) => currentRow.length >=4 })
      .oneTime().resize())
    
    return ctx.wizard.next();        
     
  }).catch(function (error) {
    // handle error
    console.log('request error when updating worker: ', error);
    logIt('request error when updating worker: ', error);
    ctx.reply('Введены неверные данные попробуйте еще раз!');
    return
  }) 
});

chengeSubscribe.action('chooseHash',  (ctx)=>{
  ctx.wizard.steps[3](ctx);
  ctx.wizard.selectStep(4);
 // console.log('cursor: ', ctx.wizard.cursor);
});

chengeSubscribe.action('chooseblock',  (ctx)=>{
  if (ctx.wizard.state.block =='нет'){
    ctx.wizard.state.block ='да'
      ctx.reply('Оповещение о новом блоке', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          { text: "Подписаться", callback_data: "subHash" }
        ])
     }) 
  } else{
    ctx.wizard.state.block ='нет'
    ctx.reply('Оповещение о новом блоке', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        { text: "Отписаться", callback_data: "subHash" }
      ])
   }) 
  } 
});

chengeSubscribe.action('chooseEth', (ctx)=>{
  ctx.wizard.state.poolId = 'ethpool';
  ctx.reply('Подписаться на оповещение о новом блоке ethereum?', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      { text: "Да", callback_data: 'subBlockEth' }, 
      { text: "Нет", callback_data: 'notSubBlockEth' }
    ])
  }) 
  
});

chengeSubscribe.action('subBlockEth',  (ctx)=>{
  ctx.wizard.state.block = 'да'
  ctx.reply('Введите ethereum кошелек:');
  return ctx.wizard.next(); 
});

chengeSubscribe.action('notSubBlockEth',  (ctx)=>{
  ctx.wizard.state.block = 'нет'
  ctx.reply('Введите ethereum кошелек:');
});

chengeSubscribe.action('chooseErgo',  (ctx)=>{
  ctx.wizard.state.poolId = 'ergopool'
  ctx.reply('Подписаться на оповещение о новом блоке ergo?', {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      { text: "Да'", callback_data: 'subBlockErgo' }, 
      { text: "Нет", callback_data: 'notSubBlockErgo' }
    ])
  }) 
});

chengeSubscribe.action('subBlockErgo',  (ctx)=>{
  ctx.wizard.state.block = 'да'
  ctx.reply('Введите ergo кошелек:');
  return ctx.wizard.next(); 
});

chengeSubscribe.action('notSubBlockErgo',  (ctx)=>{
  ctx.wizard.state.block = 'нет'
  ctx.reply('Введите ergo кошелек:');
});
// Выбор единиц измерения хешрейта----------------------------------------------
chengeSubscribe.action('chooseK',  (ctx)=>{
  if (ctx.wizard.state.curWorkerIndex!==undefined)
    ctx.wizard.state.workers[ctx.wizard.state.curWorkerIndex].hashDev = 'KH/s';
  else ctx.wizard.state.tempWorker.hashDev  = 'KH/s';
  ctx.reply('Введите значение порогового уровня хашрейта в KH/s:');
});
chengeSubscribe.action('chooseM',  (ctx)=>{
  ctx.wizard.state.stepError = false;
  if (ctx.wizard.state.curWorkerIndex!=undefined)
    ctx.wizard.state.workers[ctx.wizard.state.curWorkerIndex].hashDev = 'MH/s';
  else ctx.wizard.state.tempWorker.hashDev  = 'MH/s';
  ctx.reply('Введите значение порогового уровня хашрейта в MH/s:');
});
chengeSubscribe.action('chooseG',  (ctx)=>{
  ctx.wizard.state.stepError = false;
  if (ctx.wizard.state.curWorkerIndex!=undefined)
    ctx.wizard.state.workers[ctx.wizard.state.curWorkerIndex].hashDev = 'GH/s';
  else ctx.wizard.state.tempWorker.hashDev  = 'GH/s';
  ctx.reply('Введите значение порогового уровня хашрейта в GH/s:');
});
chengeSubscribe.action('chooseT',  (ctx)=>{
  ctx.wizard.state.stepError = false;
  if (ctx.wizard.state.curWorkerIndex!=undefined)
    ctx.wizard.state.workers[ctx.wizard.state.curWorkerIndex].hashDev = 'TH/s';
  else ctx.wizard.state.tempWorker.hashDev  = 'TH/s';
  ctx.reply('Введите значение порогового уровня хашрейта в TH/s:');
  });
chengeSubscribe.action('chooseP',  (ctx)=>{
  ctx.wizard.state.stepError = false;
  if (ctx.wizard.state.curWorkerIndex!=undefined)
    ctx.wizard.state.workers[ctx.wizard.state.curWorkerIndex].hashDev = 'PH/s';
  else  ctx.wizard.state.tempWorker.hashDev  = 'PH/s';
  ctx.reply('Введите значение порогового уровня хашрейта в PH/s:');
});
//---------------------------------------------------------------

chengeSubscribe.action('subHash', (ctx)=>{
  if(ctx.wizard.state.tempWorker!=undefined){
    ctx.wizard.state.workers.push(ctx.wizard.state.tempWorker)
    
  }
  let changedUser = {
    userId  : ctx.chat.id,
    poolId  : ctx.wizard.state.poolId,
    wallet  : ctx.wizard.state.wallet,
    block   : ctx.wizard.state.block, 
    workers : ctx.wizard.state.workers,
  };
  
  let index = users.findIndex(item=>item.userId == ctx.chat.id);
  //console.log('index=>',index)
  if (index != -1){
    users.splice(index, index+1);
    users.push(changedUser);
   // console.log('User chenged: ', newUser);
   // console.log('All current users: ', users);
    try{
     
      fs.writeFileSync('./src/storage/users.json', JSON.stringify(users));
      console.log('User data changed: Id -> ', changedUser.userId);
      logIt('User data changed: Id -> ', changedUser.userId);
      
    }catch(err){
      console.log('Error writing to user changes file: ', err);
      logIt('Error writing to user changes file: ', err);
    }
   
    ctx.reply('Ваши данные изменены!');
    ctx.scene.leave();
    ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
     { text: "Продолжить", callback_data: 'onStart' },    
      ])
  })
  }
});
  
chengeSubscribe.action('back', (ctx)=> {
  ctx.scene.leave();
  ctx.scene.enter("homeSceneWizard")  
});

chengeSubscribe.command('/back', (ctx) => {
  ctx.scene.leave();
  ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
     { text: "Продолжить", callback_data: 'onStart' },    
      ])
  })
})
  

module.exports = chengeSubscribe;


   
