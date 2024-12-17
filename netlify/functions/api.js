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
            diet: diet,
            instructionsRequired: true
        });

        const response = await fetch(`${API_BASE_URL}/findByIngredients?${params}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

app.get('/recipe/:id', async (req, res) => {
    try {
        const params = new URLSearchParams({
            apiKey: SPOONACULAR_API_KEY
        });

        const response = await fetch(`${API_BASE_URL}/${req.params.id}/information?${params}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipe details' });
    }
});

module.exports.handler = serverless(app); 