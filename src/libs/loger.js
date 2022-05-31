const fs = require('fs');
const settings = require('../../botSettings.json');
let logIt = function(log, ...obj){

  if(!settings.eventsLoger) return;
  let oldLogs=null
  try{
    oldLogs = fs.readFileSync('./src/storage/logs.txt', "utf8");
  }catch(err){
    console.log('Ошибка чтения файла логов: ./src/storage/logs.txt ', err)
  }
  
  let date = new Date()
  let year  = date.getFullYear();
  let month = (date.getMonth()+1) < 10 ? '0' + (date.getMonth()+1) : (date.getMonth()+1);
  let day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  let hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  let min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  let time  = `${hour}:${min}`;
  let data = `${day}.${month}.${year} \n`
  
  if(oldLogs.indexOf(data)==-1){
    try{
      fs.appendFileSync('./src/storage/logs.txt', data);
    }catch(err){console.log('Ошибка записи файла логов: ./src/storage/logs.txt ', err)}
  } 
  try{
    fs.appendFileSync('./src/storage/logs.txt', '     ' +  time +' > ' + log + obj.toString() +'\n'); 
  }catch(err){
    console.log('Ошибка записи файла логов: ./src/storage/logs.txt ', err)
  }
  
   
};

 module.exports = {logIt}
