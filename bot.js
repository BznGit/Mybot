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
const users = require('./src/controls/users.json');
const {formatHashrate} = require('./src/libs/utils.js');
const {koeff} = require('./src/libs/utils.js');
// Создаем менеджера сцен
const stage = new Scenes.Stage();

// Регистрируем сцену создания матча
stage.register( home, subscribe, unSubscribe, chengeSubscribe);
//begin();
bot.use(session());
bot.use(stage.middleware());
//bot.use(require('./src/composers/api.composer'));
bot.start((ctx) =>{
  if (ctx.from.id != settings.adminId && ctx.chat.type =='group'){
    ctx.reply('У Вас недостаточно прав для выполнения этой команды');
    return; 
  }
  ctx.scene.enter("homeSceneWizard")
})

// Запуск бота
bot.launch();



var lastBlock = null;
var tempBlock  =null;
function start(){
  setInterval(getBlock, settings.monitoringPeriodSec*1000);
  setInterval(getHash, settings.monitoringPeriodSec*1000)
  console.log('Monitoring started');
};
//Остановка опроса API

function stop(){
  clearInterval(getInfo)
  console.log('Monitoring stoped');
}

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
    timeout: 1000
  })
  .then(res => {
  let currBlock = res.data[0];
    if (tempBlock != null){   
      if (currBlock.blockHeight==tempBlock.blockHeight && currBlock.status=='confirmed'){
        console.log('Active users:', users);
        if (users.length!=0){        
          users.forEach(item => {
            if (item.block =='да'){
              console.log('Message sended!')
              bot.telegram.sendMessage(item.userId,
                "НОВЫЙ БЛОК ПОДТВЕРЖДЕН!"+"\n"+
                "<b>Высота блока: </b>"  + currBlock.blockHeight +"\n" +
                "<b>Сложность сети: </b>" + currBlock.networkDifficulty +"\n"+
                "<b>Тип: </b>" + currBlock.type +"\n"+
                "<b>Усилие: </b>" + Math.trunc(currBlock.effort*100)+"%" +"\n"+
                "<b>Награда: </b>" + currBlock.reward +"\n"+
                "<b>Ссылка: </b>" +    currBlock.infoLink +"\n"+
                "<b>Майнер: </b>" +    currBlock.miner +"\n"+
                "<b>Создан: </b>" +    currBlock.created, {parse_mode: 'HTML'}
              ); 
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
      if (lastBlock.blockHeight != currBlock.blockHeight){
      if (users.length!=0){        
        users.forEach(item => {
          if (item.block =='да'){
            console.log('Message sended');
            bot.telegram.sendMessage(item.userId,
              "НАЙДЕН НОВЫЙ БЛОК!"+"\n"+
              "<b>Высота блока: </b>"  + currBlock.blockHeight +"\n" +
              "<b>Сложность сети: </b>" + currBlock.networkDifficulty +"\n"+
              "<b>Ссылка: </b>" +    currBlock.infoLink +"\n"+
              "<b>Майнер: </b>" +    currBlock.miner +"\n", {parse_mode: 'HTML'}
            );
          }
          temptBlock = {
            blockHeight: currBlock.blockHeight,
            status: currBlock.status
          } 
        });
      }
    }
  } 
  })
  .catch(error => {
  console.error('API Erorr: ', error);
  bot.telegram.sendMessage(settings.adminId, 'Ошибка AXIOS запроса:\n' + error)
  })
};

function  getHash(){
  users.forEach(item =>{
    axios({
      url: api2 + '/api/pools/' + item.poolId + '/miners/' + item.wallet,
      method: 'get',
      timeout: 1000})
    .then((response)=> {
      // handle success
      let curHash = response.data.performance.workers[item.worker].hashrate;
    
      let porogHash =  item.levelHash*koeff(item.defHash)
      ;
      //console.log('curHash   -',  curHash )
     // console.log('porogHash -',  porogHash )
     // console.log(curHash<porogHash)
      if (curHash<porogHash && item.delivered==false){    
        bot.telegram.sendMessage(item.userId,
          '<b>Предупреждение!</b>\n' +
          'Хешрейт  кошелека\n' +
          '<i>' + item.wallet  + '</i>' + ' \n' +
          'с воркером '   + '<i>' +  item.worker + '</i>' + '\n' +
          'опустился ниже установленного в ' + '<i>' +  item.levelHash + '</i>'  +' ' + '<i>' +  item.defHash + '</i>\n' +
          'и составляет ' + '<i>' +  formatHashrate(curHash)+ '</i>\n\n' +
           '<b>ВНИМАНИЕ! Оповещение об уровне хешрейта отключено.</b>\n' +
          'Для возобновления оповещения устовновите новый уровень хешрейта'
          , {parse_mode: 'HTML'}
        );
        item.delivered = true;
      }
    
      if (response.data.performance == undefined){
        console.log('Ошибка опроса хешрейта!');
      
        return
      }
     
      
    }).catch(function (error) {
      // handle error
     console.log(error);

      return
    })
  })  
}



