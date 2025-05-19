const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors({
    origin: ['http://localhost:63342'] // For local testing
}));
app.use(express.json());

// Root route to avoid "cannot GET /"
app.get('/', (req, res) => {
    res.send('Loxo backend is running. Use /loxo-data to fetch job data.');
});

app.get('/loxo-data', async (req, res) => {
    try {
        // Check API key
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
        }

        const response = await fetch('https://app.loxo.co/api/pinnacle-recruitment-services/jobs', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.LOXO_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Loxo API error: ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Secret box is on');
});
