const { Telegraf } = require('telegraf');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const config = require('./config');

// Инициализация бота и экспресс
const bot = new Telegraf(config.BOT_TOKEN);
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Команды бота
bot.command('start', (ctx) => {
    ctx.reply('Найдите рецепты по вашим ингредиентам:', {
        reply_markup: {
            inline_keyboard: [[
                { text: "Открыть приложение", web_app: { url: "https://ваш-домен.com" } }
            ]]
        }
    });
});

// API endpoints
async function searchRecipesByIngredients(ingredients, diet = '') {
    const params = new URLSearchParams({
        apiKey: config.SPOONACULAR_API_KEY,
        ingredients: ingredients.join(','),
        number: 10,
        diet: diet,
        instructionsRequired: true
    });

    try {
        const response = await fetch(`${config.API_BASE_URL}/findByIngredients?${params}`);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('Error fetching recipes:', error);
        throw error;
    }
}

async function getRecipeDetails(id) {
    const params = new URLSearchParams({
        apiKey: config.SPOONACULAR_API_KEY
    });

    try {
        const response = await fetch(`${config.API_BASE_URL}/${id}/information?${params}`);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        throw error;
    }
}

// Endpoints
app.post('/api/search-recipes', async (req, res) => {
    try {
        const { ingredients, diet } = req.body;
        const recipes = await searchRecipesByIngredients(ingredients, diet);
        res.json(recipes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

app.get('/api/recipe/:id', async (req, res) => {
    try {
        const recipe = await getRecipeDetails(req.params.id);
        res.json(recipe);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipe details' });
    }
});

// Запуск сервера и бота
app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});

bot.launch().then(() => {
    console.log('Bot is running');
}).catch((error) => {
    console.error('Bot launch failed:', error);
});

// Graceful shutdown
process.once('SIGINT', () => {
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
});
