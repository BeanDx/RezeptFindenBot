const { Telegraf } = require('telegraf');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const config = require('./config');

// Инициализация бота и экспресс
const bot = new Telegraf(config.BOT_TOKEN);
const app = express();

app.use(cors());
app.use(express.json());

// Обновленная команда start с украинским текстом
bot.command('start', (ctx) => {
    ctx.reply('Знайдіть рецепти за вашими інгредієнтами!', {
        reply_markup: {
            keyboard: [[{
                text: "Відкрити додаток",
                web_app: {
                    url: process.env.WEBAPP_URL || 'https://rezept-finden.netlify.app'
                }
            }]],
            resize_keyboard: true,
            persistent: true
        }
    });
});

// Обработчик данных из веб-приложения
bot.on('web_app_data', (ctx) => {
    console.log('Получены данные из веб-приложения:', ctx.webAppData);
});

// Запуск бота
bot.launch().then(() => {
    console.log('Бот запущен');
}).catch((error) => {
    console.error('Ошибка запуска бота:', error);
});

// Для локальной разработки используем порт 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
