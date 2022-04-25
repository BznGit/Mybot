const settings = require('./botSettings.json');
const { Telegraf, Scenes, session, Markup, Extra} = require('telegraf');
const bot = new Telegraf('5188858155:AAEhdou9ZZ4Ne8HipCCAuWMfIm-qH5LfwzM');

const home = require('./src/scense/homeScene');
const subscribe = require('./src/scense/blockScene');
const hashrate = require('./src/scense/hashScene');
const monit = require('./src/controls/apiControls');
const monitor = new monit();


// Создаем менеджера сцен
const stage = new Scenes.Stage();
//monitor.begin();

// Регистрируем сцену создания матча
stage.register(subscribe, hashrate, home);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) =>{
  if (ctx.from.id != settings.adminId && ctx.chat.type =='group'){
    ctx.reply('У Вас недостаточно прав для выполнения этой команды');
    return; 
  }
  ctx.scene.enter("home")
})


// Запуск бота
bot.launch();


