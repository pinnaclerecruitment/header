const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());

app.get('/loxo-data', async (req, res) => {
    try {
        const response = await fetch('https://app.loxo.co/api/pinnacle-recruitment-services/jobs', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.LOXO_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error('Loxo messed up');
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
