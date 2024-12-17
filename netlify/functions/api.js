const express = require('express');
const serverless = require('serverless-http');
const fetch = require('node-fetch');
const translate = require('@vitalets/google-translate-api');
const router = express.Router();
const app = express();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const API_BASE_URL = 'https://api.spoonacular.com/recipes';

app.use(express.json());
app.use('/.netlify/functions/api', router);

// Функция для перевода текста
async function translateToUkrainian(text) {
    if (!text) return '';
    try {
        const result = await translate(text, { to: 'uk' });
        return result.text;
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return text;
    }
}

router.post('/search-recipes', async (req, res) => {
    try {
        const { ingredients, diet } = req.body;
        
        const params = new URLSearchParams({
            apiKey: SPOONACULAR_API_KEY,
            ingredients: ingredients.join(','),
            number: 10,
            diet: diet || '',
            instructionsRequired: true,
            fillIngredients: true,
            addRecipeInformation: true
        });

        const url = `${API_BASE_URL}/complexSearch?${params}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API ответ: ${response.status}`);
        }

        const data = await response.json();
        
        // Переводим результаты
        const translatedResults = await Promise.all((data.results || []).map(async recipe => ({
            ...recipe,
            title: await translateToUkrainian(recipe.title),
            usedIngredientCount: recipe.usedIngredientCount,
            missedIngredientCount: recipe.missedIngredientCount,
            id: recipe.id,
            image: recipe.image
        })));

        res.json(translatedResults);
    } catch (error) {
        console.error('Ошибка поиска рецептов:', error);
        res.status(500).json({ 
            error: 'Помилка при пошуку рецептів',
            details: error.message 
        });
    }
});

router.get('/recipe/:id', async (req, res) => {
    try {
        const params = new URLSearchParams({
            apiKey: SPOONACULAR_API_KEY
        });

        const response = await fetch(`${API_BASE_URL}/${req.params.id}/information?${params}`);
        
        if (!response.ok) {
            throw new Error('API request failed');
        }

        const recipe = await response.json();
        
        // Переводим данные рецепта
        const translatedRecipe = {
            ...recipe,
            title: await translateToUkrainian(recipe.title),
            instructions: await translateToUkrainian(recipe.instructions),
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            image: recipe.image
        };

        res.json(translatedRecipe);
    } catch (error) {
        console.error('Get recipe details error:', error);
        res.status(500).json({ 
            error: 'Помилка при отриманні деталей рецепту',
            details: error.message 
        });
    }
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Внутрішня помилка сервера',
        details: err.message 
    });
});

module.exports.handler = serverless(app); 