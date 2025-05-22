const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Log environment variables to confirm they're loaded
console.log('Environment:', {
    token: process.env.LOXO_TOKEN ? 'Token present' : 'Token missing',
    port: process.env.PORT || 3000
});

app.get('/', (req, res) => {
    res.send('Backend is running. Use /loxo-data for jobs.');
});

app.get('/loxo-data', async (req, res) => {
    try {
        // Get page parameter from query, default to 1 if not provided
        const page = req.query.page || 1;
        const apiUrl = `https://app.loxo.co/api/pinnacle-recruitment-services/jobs?status=published&page=${page}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.LOXO_TOKEN}`,
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) {
            throw new Error(`Loxo error: ${response.status}`);
        }
        const data = await response.json();
        // Log response details to track updates
        console.log('API response at:', new Date().toISOString(), 'Page:', page, 'Data count:', data.results?.length || 'No results', 'Data:', data);
        res.set('Cache-Control', 'no-cache'); // Prevent server response caching
        res.json(data);
    } catch (error) {
        console.error('Error fetching Loxo data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is on');
});
