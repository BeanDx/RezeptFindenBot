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
        
        console.log('Получены ингредиенты (укр):', ingredients);
        
        // Добавляем базовые варианты перевода для распространенных ингредиентов
        const ingredientMappings = {
            'куряча грудка': 'chicken',
            'морква': 'carrots',
            // Можно добавить больше соответствий
        };

        // Переводим ингредиенты на английский для API
        const translatedIngredients = await Promise.all(
            ingredients.map(async (ing) => {
                try {
                    // Сначала проверяем, есть ли прямое соответствие
                    if (ingredientMappings[ing.toLowerCase()]) {
                        return ingredientMappings[ing.toLowerCase()];
                    }
                    // Если нет, используем перевод
                    const translated = await translate(ing, { from: 'uk', to: 'en' });
                    console.log(`Перевод: ${ing} -> ${translated}`);
                    return translated;
                } catch (error) {
                    console.error(`Ошибка перевода для ${ing}:`, error);
                    return ing;
                }
            })
        );
        
        console.log('Переведенные ингредиенты (англ):', translatedIngredients);

        // Изменяем параметры запроса для более гибкого поиска
        const params = new URLSearchParams({
            apiKey: SPOONACULAR_API_KEY,
            ingredients: translatedIngredients.join(','),
            number: 10,
            diet: diet || '',
            ignorePantry: false, // Добавляем этот параметр
            ranking: 2, // Используем более гибкий рейтинг
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
            const [translatedTitle, translatedIngredients] = await Promise.all([
                translateToUkrainian(recipe.title),
                Promise.all((recipe.missedIngredients || []).map(ing => 
                    translateToUkrainian(ing.name)
                ))
            ]);
            
            return {
                ...recipe,
                title: translatedTitle,
                missedIngredients: recipe.missedIngredients.map((ing, i) => ({
                    ...ing,
                    name: translatedIngredients[i]
                })),
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