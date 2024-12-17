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

        console.log('Searching recipes with params:', params.toString());

        const response = await fetch(`${API_BASE_URL}/complexSearch?${params}`);
        
        if (!response.ok) {
            console.error('API Error:', await response.text());
            throw new Error('API request failed');
        }

        const data = await response.json();
        console.log('API Response:', data);

        res.json(data.results || []);
    } catch (error) {
        console.error('Search recipes error:', error);
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