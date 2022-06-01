const settings = require('./botSettings.json');
const { Telegraf, Scenes, session, Markup, Extra} = require('telegraf');
const bot = new Telegraf(settings.telegramBotToken);
const axios = require('axios');
const api = settings.MiningCoreApiEndpoints +'/api/pools/ethpool/blocks';
const api2 = settings.MiningCoreApiEndpoints;
const home = require('./src/scense/homeScene');
const unSubscribe = require('./src/scense/unSubScene');
const subscribe = require('./src/scense/subScene');
const chengeSubscribe = require('./src/scense/chengeSubScene');
const users = require('./src/storage/users.json');
const {formatHashrate} = require('./src/libs/utils.js');
const {koeff} = require('./src/libs/utils.js');
const {logIt} = require('./src/libs/loger.js');
const fs = require('fs');

// Создаем менеджера сцен
const stage = new Scenes.Stage();
stage.register( home, subscribe, unSubscribe, chengeSubscribe);
begin();
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) =>{
  if (ctx.from.id != settings.adminId && ctx.chat.type =='group'){
    ctx.reply('У Вас недостаточно прав для выполнения этой команды');
    return; 
  }
  ctx.reply(settings.wellcomeText, {parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
     { text: "Продолжить", callback_data: 'onStart' },    
      ])
  })
})

bot.action('onStart', (ctx)=>{
  ctx.scene.enter("homeSceneWizard")
})

// Запуск бота
bot.launch();

var lastBlock = null;
var tempBlock  =null;
function start(){
  setInterval(getBlock, settings.monitoringPeriodSec*1000);
  setInterval(getHash, settings.monitoringPeriodSec*1000)
  console.log('Bot started');
  logIt('Bot started');
};

//Получение номера последнего блока
function begin(){
  axios.get(api).then(res => {
  lastBlock = {
    height:res.data[0].blockHeight,
    status: res.data[0].status
  } 
  start();
  })
}

function getBlock(){
  axios({
    url: api,
    method: 'get',
    timeout: 2000
  }).then(res => {
    let currBlock = res.data[0];
    if (tempBlock != null){   
      if (currBlock.blockHeight==tempBlock.blockHeight && currBlock.status=='confirmed'){
        //console.log('Active users:', users);
        if (users.length!=0){        
          users.forEach(item => {
            if (item.block =='да'){
              try{
                bot.telegram.sendMessage(item.userId,
                  '<b>Новый блок подтвержден!</b>\n'+
                  'Параметры блока:\n' +
                  "<b>- высота блока: </b>"  + currBlock.blockHeight +";\n" +
                  "<b>- сложность сети: </b>" + currBlock.networkDifficulty +";\n"+
                  "<b>- тип: </b>" + currBlock.type +";\n"+
                  "<b>- усилие: </b>" + Math.trunc(currBlock.effort*100)+"%" +";\n"+
                  "<b>- награда: </b>" + currBlock.reward +";\n"+
                  "<b>- ссылка: </b>" +    currBlock.infoLink +";\n"+
                  "<b>- майнер: </b>" +    currBlock.miner +";\n"+
                  "<b>- создан: </b>" +    currBlock.created, {parse_mode: 'HTML'}
                ); 
                console.log('Block confirmation message sent to user: Id -> ', item.userId);
                logIt('Block confirmation message sent to user: Id ->', item.userId)
              }catch(err){
                console.log('Error sending message about confirmed block! ', err);
                logIt('Error sending message about confirmed block! ', err);
                bot.telegram.sendMessage(settings.adminId, 'Error sending message about confirmed block! \n' + err);
              }
            }
          });
        }
        lastBlock =  {
          blockHeight:currBlock.blockHeight,
          status: currBlock.status,
        };
        tempBlock = null;
      }
    } else {
        if (lastBlock.blockHeight == currBlock.blockHeight){
        if (users.length!=0){        
          users.forEach(item => {
            if (item.block =='да'){
            
              try{
                bot.telegram.sendMessage(item.userId,
                  '<b>Найден новый блок!</b>\n'+
                  'Параметры блока:\n' +
                  "<b>- высота блока: </b>"  + currBlock.blockHeight +";\n" +
                  "<b>- сложность сети: </b>" + currBlock.networkDifficulty +";\n"+
                  "<b>- ссылка: </b>" +    currBlock.infoLink +";\n"+
                  "<b>- майнер: </b>" +    currBlock.miner +"\n", {parse_mode: 'HTML'}
                );
                console.log('Sent message about new block to user: Id -> ', item.userId);
                logIt('Sent message about new block to user: Id -> ', item.userId);
              }catch(err){
                console.log('Error sending message about new block! ', err);
                logIt('Error sending message about new block! ', err());
                bot.telegram.sendMessage(settings.adminId, 'Error sending message about new block! \n' + err);
              }
            }
            tempBlock = {
              blockHeight: currBlock.blockHeight,
              status: currBlock.status
            } 
          });
        }
      }
    } 
  }).catch(error => {
    console.error('API ERORR! Block request: ', error);
    logIt('API ERORR! Block request: ', error);
    bot.telegram.sendMessage(settings.adminId, 'API ERORR! Block request: \n' + error);
  })
};

function  getHash(){
  users.forEach(item =>{
    axios({
      url: api2 + '/api/pools/' + item.poolId + '/miners/' + item.wallet,
      method: 'get',
      timeout: 2000})
    .then((response)=> {
      if(response.data.performance==undefined){
        try{
          bot.telegram.sendMessage(item.userId,
            'Ваше кошельк <b>' + item.wallet   + '</b>\n' +
            'неактуален!'  
          );
        }catch(err){
          console.log('API ERORR! Performance request: ', err);
          logIt('API ERORR! Performance request: ', err);
        }
        return
      }
      let allWorkers = response.data.performance.workers; // Все сущесивующие воркеры
      let controlledWorkers = item.workers; // Все контрорлируемые воркеры
      //Цикл проверки воркеров ---------------
      controlledWorkers.forEach(itemCW=>{
        if (itemCW.name=='default') itemCW.name= '';
          if (allWorkers[itemCW.name]!=undefined){
            let itemAWhash = allWorkers[itemCW.name].hashrate;
            let itemPorog = itemCW.hashLevel*koeff(itemCW.hashDev)
            if (itemAWhash<itemPorog && itemCW.delivered==false){    
              try{
                bot.telegram.sendMessage(item.userId,
                  '<b>Предупреждение!</b>\n' +
                  'Хешрейт  кошелька\n<b>' + item.wallet   + '</b> \n' +
                  'с воркером '   + '«<b>' +  `${itemCW.name ==''? 'default': itemCW.name}` + '</b>»' + '\n' +
                  'опустился ниже установленного в <b>'  +  itemCW.hashLevel   +' '  +  itemCW.hashDev + '</b>\n' +
                  'и составляет <b>'  +  formatHashrate(itemAWhash)+ '</b>\n\n' +
                  '<b>Внимание! Оповещение об уровне хешрейта отключено.</b>\n' +
                  'Для возобновления оповещения устовновите новый уровень хешрейта для этого воркера', 
                  {parse_mode: 'HTML'}
                );
                itemCW.delivered = true;
                console.log('A hashrate message has been sent to the user: Id -> ', item.userId);
                logIt('A hashrate message has been sent to the user: Id -> ', item.userId);
              }catch(err){
                console.log('Error sending message about hashrate! ', err);
                logIt('Error sending message about hashrate! ', err);
                bot.telegram.sendMessage(settings.adminId, 'Error sending message about hashrate!  \n' + err);
              }
              
            }
        }else{
          if (itemCW.delivered==false){
            bot.telegram.sendMessage(item.userId,           
              'Воркер '   + '«<b>' +  `${itemCW.name ==''? 'default': itemCW.name}` + '</b>»' + ' для кошелька' +'\n' +
              '<b>' + item.wallet  + '</b>' +'\n' +
              'больше не существует. Он буде автоматически удален из  Вашего списка контрорлируемых воркеров',
              {parse_mode: 'HTML'}
            );
            let index = controlledWorkers.findIndex(item=>item.name == itemCW.name);
            if (index != -1){
              controlledWorkers.splice(index, index+1);
              console.log('Unused worker: «' + itemCW.name + '» of wallet: "' + item.wallet + '" deleted');
              logIt('Unused worker: «' + itemCW.name + '» of wallet: "' + item.wallet + '" deleted');
           }
          }
        }
      })
      
      //-------------------------------------------
      if (response.data.performance == undefined){
        console.log('Hash polling error!');
        logIt('Hash polling error! bot.js 194 стр');
        return
      }
    }).catch(function (error){
       console.log('API ERORR! Hashrate request: ', error);
       logIt('API ERORR! Hashrate request: ', error);
       bot.telegram.sendMessage(settings.adminId, 'API ERORR! Hashrate request: \n' + error);
      return
     })
  })
  try{
     fs.writeFileSync('./src/storage/users.json', JSON.stringify(users));
  }catch(err){
    console.log('Error writing to the information file of the delivered message: ',err);
    logIt('Error writing to the information file of the delivered message: ',err);
  }
}



