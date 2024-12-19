require('dotenv').config();

const config = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    SPOONACULAR_API_KEY: process.env.SPOONACULAR_API_KEY,
    PORT: process.env.PORT || 3001,
    API_BASE_URL: 'https://api.spoonacular.com/recipes'
};

module.exports = config;
