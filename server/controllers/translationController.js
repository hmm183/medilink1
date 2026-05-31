const axios = require('axios'); // You'll need to install axios: npm install axios

// The API key is securely loaded from your .env file
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;


exports.translateText = async (req, res) => {
    const { q, target } = req.body;

    if (!q || !target) {
        return res.status(400).json({ error: 'Missing text to translate or target language.' });
    }
    // ✅ Fix: Add a check for an empty array before calling the API
    if (q.length === 0) {
        return res.status(200).json({ translations: [] });
    }

    try {
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
            { q, target, format: "text" }
        );

        // Extract the translated text and send it back to the client
        const translations = response.data.data.translations.map(t => t.translatedText);
        res.status(200).json({ translations });

    } catch (error) {
        console.error('Error calling Google Translate API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to translate text.' });
    }
};