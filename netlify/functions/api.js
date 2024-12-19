const express = require('express');
const serverless = require('serverless-http');
const fetch = require('node-fetch');
const translate = require('translate-google');
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
        return result;
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return text;
    }
}

router.post('/search-recipes', async (req, res) => {
    try {
        const { ingredients, diet } = req.body;
        
        console.log('Поиск рецептов для ингредиентов:', ingredients);
        
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
        console.log('Запрос к API:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Получены рецепты:', data.results);

        // Переводим результаты
        const translatedResults = await Promise.all((data.results || []).map(async recipe => {
            console.log('Переводим рецепт:', recipe.title);
            const translatedTitle = await translateToUkrainian(recipe.title);
            console.log('Переведенное название:', translatedTitle);
            
            return {
                ...recipe,
                title: translatedTitle,
                usedIngredientCount: recipe.usedIngredientCount,
                missedIngredientCount: recipe.missedIngredientCount,
                id: recipe.id,
                image: recipe.image
            };
        }));

        console.log('Переведенные результаты:', translatedResults);
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
        const recipe = await response.json();
        
        console.log('Получен рецепт:', recipe.title);

        // Переводим данные рецепта
        const translatedTitle = await translateToUkrainian(recipe.title);
        const translatedInstructions = await translateToUkrainian(recipe.instructions);
        
        console.log('Переведенное название:', translatedTitle);
        
        const translatedRecipe = {
            ...recipe,
            title: translatedTitle,
            instructions: translatedInstructions,
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