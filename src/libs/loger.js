const fs = require('fs');
const settings = require('../../botSettings.json');
let logIt = function(log, ...obj){

  if(!settings.eventsLoger) return;
 
  let oldLogs = fs.readFileSync('./src/storage/logs.txt', "utf8");
  let date = new Date()
  let year  = date.getFullYear();
  let month = (date.getMonth()+1) < 10 ? '0' + (date.getMonth()+1) : (date.getMonth()+1);
  let day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  let hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  let min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  let time  = `${hour}:${min}`;
  let data = `${day}.${month}.${year} \n`

  let regexp = /[data]/;
  if(!regexp.test(oldLogs)){
    fs.appendFileSync('./src/storage/logs.txt', data);
  } 
  fs.appendFileSync('./src/storage/logs.txt', '     ' +  time +' | ' + log + obj.toString() +'\n'); 
   
};

 module.exports = {logIt}
