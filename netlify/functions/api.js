const express = require('express');
const serverless = require('serverless-http');
const fetch = require('node-fetch');
const app = express();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const API_BASE_URL = 'https://api.spoonacular.com/recipes';

app.use(express.json());

app.post('/search-recipes', async (req, res) => {
    try {
        const { ingredients, diet } = req.body;
        
        console.log('Получен запрос с ингредиентами:', ingredients);
        console.log('Диета:', diet);
        
        const params = new URLSearchParams({
            apiKey: SPOONACULAR_API_KEY,
            ingredients: ingredients.join(','),
            number: 10,
            diet: diet || '',
            instructionsRequired: true,
            fillIngredients: true,
            addRecipeInformation: true,
            language: 'uk'
        });

        const url = `${API_BASE_URL}/complexSearch?${params}`;
        console.log('URL запроса к API:', url);

        const response = await fetch(url);
        const responseText = await response.text();
        
        console.log('Ответ от API:', responseText);
        
        if (!response.ok) {
            throw new Error(`API ответ: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        res.json(data.results || []);
    } catch (error) {
        console.error('Ошибка поиска рецептов:', error);
        res.status(500).json({ 
            error: 'Помилка при пошуку рецептів',
            details: error.message 
        });
    }
});

app.get('/recipe/:id', async (req, res) => {
    try {
        const params = new URLSearchParams({
            apiKey: SPOONACULAR_API_KEY,
            language: 'uk'
        });

        const response = await fetch(`${API_BASE_URL}/${req.params.id}/information?${params}`);
        
        if (!response.ok) {
            console.error('API Error:', await response.text());
            throw new Error('API request failed');
        }

        const data = await response.json();
        res.json(data);
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