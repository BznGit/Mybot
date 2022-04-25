const settings = require('./botSettings.json');
const { Telegraf, Scenes, session, Markup, Extra} = require('telegraf');
const bot = new Telegraf('5188858155:AAEhdou9ZZ4Ne8HipCCAuWMfIm-qH5LfwzM');
const home = require('./src/scense/homeScene');
const subscribe = require('./src/scense/subscribeScene');
const hashrate = require('./src/scense/hashrateScene');
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
  ctx.scene.enter("home")
})


// Запуск бота
bot.launch();


