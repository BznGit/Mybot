const { Composer } = require('telegraf');
const composer = new Composer();
const axios = require('axios');
const settings = require('../../botSettings.json');
const api = settings.MiningCoreApiEndpoints +'/api/pools/ethpool/blocks';
var chatIdes=null;
var lastBlock = null;
var tempBlock  =null;

exports =  function start(){
    chatIdes = require('./chatId.json');
    setInterval(getInfo, settings.monitoringPeriodSec*1000)
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
    this.start();
    })
}


function getInfo(){
axios({
  url: api,
  method: 'get',
  timeout: 500
})
.then(res => {
  let currBlock = res.data[0];
    if (tempBlock != null){
    
    if (currBlock.blockHeight==tempBlock.blockHeight && currBlock.status=='confirmed'){
      console.log('Active users:', chatIdes);
      if (chatIdes.length!=0){        
        chatIdes.forEach(item => {
          console.log('Message sended!')
          composer.telegram.sendMessage(item,
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
      if (chatIdes.length!=0){        
        chatIdes.forEach(item => {
          console.log('Message sent')
          composer.telegram.sendMessage(item,
            "НАЙДЕН НОВЫЙ БЛОК!"+"\n"+
            "<b>Высота блока: </b>"  + currBlock.blockHeight +"\n" +
            "<b>Сложность сети: </b>" + currBlock.networkDifficulty +"\n"+
            "<b>Ссылка: </b>" +    currBlock.infoLink +"\n"+
            "<b>Майнер: </b>" +    currBlock.miner +"\n", {parse_mode: 'HTML'}
          );
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
}
module.exports = composer; 