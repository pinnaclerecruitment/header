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
    res.send('/virus.');
});

app.get('/virus', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const apiUrl = `https://app.loxo.co/api/pinnacle-recruitment-services/jobs?status=active&published=true&page=${page}`;
        
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
        // Log response details, including descriptions and public_urls
        console.log('API response at:', new Date().toISOString(), 'Page:', page, 'Data count:', data.results?.length || 'No results');
        // Map results to include only relevant fields
        const formattedData = {
            results: data.results?.map(job => ({
                id: job.id,
                title: job.title,
                description: job.description,
                public_url: job.public_url,
                status: job.status,
                published: job.published
            })) || [],
            pagination: data.pagination // Include pagination info if available
        };
        res.set('Cache-Control', 'no-cache');
        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching Loxo data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Route to fetch a specific job by job_id
app.get('/job/:job_id', async (req, res) => {
    try {
        const jobId = req.params.job_id;
        const apiUrl = `https://app.loxo.co/api/pinnacle-recruitment-services/jobs/${jobId}?status=active&published=true`;
        
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
        // Log the job description and public_url
        console.log('Job fetched at:', new Date().toISOString(), 'Job ID:', jobId, 'Title:', data.title, 'Description:', data.description, 'Public URL:', data.public_url);
        // Verify job is active and published
        if (data.status !== 'active' || !data.published) {
            return res.status(404).json({ error: `Job with ID ${jobId} is not active or published` });
        }
        // Return relevant fields
        res.set('Cache-Control', 'no-cache');
        res.json({
            id: data.id,
            title: data.title,
            description: data.description,
            public_url: data.public_url,
            status: data.status,
            published: data.published
        });
    } catch (error) {
        console.error('Error fetching Loxo job:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is on');
});
