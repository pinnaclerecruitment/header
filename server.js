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
    res.send('Welcome to the job API.');
});

app.get('/jobs', async (req, res) => {
    try {
        // Get page parameter from query, default to 1 if not provided
        const page = req.query.page || 1;
        // Corrected API URL (assumed endpoint for active, published jobs)
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
            throw new Error(`Loxo API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Log response details for debugging
        console.log('API response at:', new Date().toISOString(), 'Page:', page, 'Data count:', data.results?.length || 'No results');

        // Extract job descriptions (assuming 'description' is a field in each job object)
        const jobsWithDescriptions = data.results?.map(job => ({
            id: job.id,
            title: job.title,
            description: job.description || 'No description available',
            // Add other fields as needed, e.g., location, status
            location: job.location || 'Not specified',
            status: job.status
        })) || [];

        res.set('Cache-Control', 'no-cache');
        res.json({
            page: parseInt(page),
            total: data.total || jobsWithDescriptions.length,
            jobs: jobsWithDescriptions
        });
    } catch (error) {
        console.error('Error fetching Loxo data:', error.message);
        res.status(500).json({ error: 'Failed to fetch job data', details: error.message });
    }
});

// Optional: Endpoint to fetch a single job's description by ID
app.get('/jobs/:id', async (req, res) => {
    try {
        const jobId = req.params.id;
        const apiUrl = `https://app.loxo.co/api/pinnacle-recruitment-services/jobs/${jobId}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.LOXO_TOKEN}`,
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Loxo API error: ${response.status} ${response.statusText}`);
        }

        const job = await response.json();

        // Extract relevant fields, focusing on description
        const jobDetails = {
            id: job.id,
            title: job.title,
            description: job.description || 'No description available',
            location: job.location || 'Not specified',
            status: job.status
        };

        res.set('Cache-Control', 'no-cache');
        res.json(jobDetails);
    } catch (error) {
        console.error('Error fetching job details:', error.message);
        res.status(500).json({ error: 'Failed to fetch job details', details: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port', process.env.PORT || 3000);
});
