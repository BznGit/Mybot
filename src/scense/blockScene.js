const fs = require('fs');
const axios = require('axios');
const settings = require('../../botSettings.json');
const api = settings.MiningCoreApiEndpoints;
const users = require('../storage/users.json');
const { Scenes, Markup } = require("telegraf");
const {logIt} = require('../libs/loger');

// Сцена регистрации нового пользователя ----------------------------------------------------------
const onBlock = new Scenes.WizardScene(
  "blockSceneWizard", 
    // Шаг 1: Ввод монеты -------------------------------------------------------------------------
    (ctx) => {
    ctx.wizard.state.stepError=false; 
    ctx.reply('Выберите одну из монет пула:', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.callback ('Ethereum','chooseEth'),
        Markup.button.callback('Ergo', 'chooseErgo'),
        Markup.button.callback('Vertcoin', 'chooseVert'),              
      ])    
    })
    return ctx.wizard.next(); 
  },
);  
// Обработчик добавления пользователя -------------------------------------------------------------
onBlock.action('subHash', (ctx)=>{
  ctx.reply('Вы подписаны на оповещение о хешрейте!')
  let curUser = {
    userId : ctx.chat.id,
    poolId : ctx.wizard.state.poolId,
    wallet : ctx.wizard.state.wallet,
    block  : ctx.wizard.state.block, 
    workers : [ctx.wizard.state.worker]
  };
  users.push(curUser);
  //Запись данных пользователя в файл -------------------------------------------------------------
  try{
    fs.writeFileSync('./src/storage/users.json', JSON.stringify(users));
    console.log('New user added: Id -> ', curUser.userId);
    logIt('New user added: Id -> ', curUser.userId);
    console.log('Total Users: ', users.length);
    logIt('Total Users: ', users.length);
  }catch(err){
    console.log('Error writing to new user file: ', err);
    logIt('Error writing to new user file: ', err);
  }
   ctx.scene.leave();
   ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
   ...Markup.inlineKeyboard([
    { text: "Продолжить", callback_data: 'onStart' },    
     ])
 })
});
 // Обработчик кнопки "назад" ---------------------------------------------------------------------
 onBlock.action('back', (ctx)=> {
  ctx.scene.leave();
  ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
     { text: "Продолжить", callback_data: 'onStart' },    
      ])
  })
});
 // Обработчик команды "назад" --------------------------------------------------------------------
 onBlock.command('/back', (ctx) => {
  ctx.scene.leave();
  ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
     { text: "Продолжить", callback_data: 'onStart' },    
      ])
  })
})

module.exports = onBlock;


   
