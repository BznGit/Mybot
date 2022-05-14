const settings = require('./botSettings.json');
const { Telegraf, Scenes, session, Markup, Extra} = require('telegraf');
const bot = new Telegraf(settings.telegramBotToken);

const home = require('./src/scense/homeScene');
const unSubscribe = require('./src/scense/unSubScene');
const subscribe = require('./src/scense/subScene');
const changeSubscribe = require('./src/scense/changeSubScene');
const monit = require('./src/controls/apiControls');
const monitor = new monit();


// Создаем менеджера сцен
const stage = new Scenes.Stage();
//monitor.begin();

// Регистрируем сцену создания матча
stage.register( home, subscribe, unSubscribe, changeSubscribe);

bot.use(session());
bot.use(stage.middleware());
bot.use(require('./src/composers/api.composer'));


bot.start((ctx) =>{
  if (ctx.from.id != settings.adminId && ctx.chat.type =='group'){
    ctx.reply('У Вас недостаточно прав для выполнения этой команды');
    return; 
  }
  ctx.scene.enter("homeSceneWizard")
})

// Запуск бота
bot.launch();


