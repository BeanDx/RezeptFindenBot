const express = require('express');
const serverless = require('serverless-http');
const fetch = require('node-fetch');
const router = express.Router();
const app = express();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const API_BASE_URL = 'https://api.spoonacular.com/recipes';

app.use(express.json());
app.use('/.netlify/functions/api', router);

router.post('/search-recipes', async (req, res) => {
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
            language: 'en',
            includeTranslations: 'uk'
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
        
        const translatedResults = (data.results || []).map(recipe => ({
            ...recipe,
            title: recipe.titleUk || recipe.title,
            instructions: recipe.instructionsUk || recipe.instructions,
            usedIngredientCount: recipe.usedIngredientCount,
            missedIngredientCount: recipe.missedIngredientCount,
            id: recipe.id,
            image: recipe.image
        }));

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
            apiKey: SPOONACULAR_API_KEY,
            language: 'en',
            includeTranslations: 'uk'
        });

        const response = await fetch(`${API_BASE_URL}/${req.params.id}/information?${params}`);
        
        if (!response.ok) {
            console.error('API Error:', await response.text());
            throw new Error('API request failed');
        }

        const recipe = await response.json();
        
        const translatedRecipe = {
            ...recipe,
            title: recipe.titleUk || recipe.title,
            instructions: recipe.instructionsUk || recipe.instructions,
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