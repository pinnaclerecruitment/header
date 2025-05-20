const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors()); // Lets your webpage connect
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Backend is running. Use /loxo-data for jobs.');
});

app.get('/loxo-data', async (req, res) => {
    try {
        const response = await fetch('https://app.loxo.co/api/pinnacle-recruitment-services/jobs/?status=activ', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.LOXO_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Loxo error: ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is on');
});
