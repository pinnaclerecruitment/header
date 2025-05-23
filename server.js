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
        // Get page parameter from query, default to 1 if not provided
        const page = req.query.page || 1;
        const apiUrl = `https://app.loxo.co/api/pinnacle-recruitment-services/jobs?status=active&published=true&page=${page}`;
        
        // Fetch job list
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
        console.log('Job list response at:', new Date().toISOString(), 'Page:', page, 'Data count:', data.results?.length || 'No results');

        // Fetch job details for each job
        const detailedJobs = await Promise.all(
            data.results.map(async (job) => {
                try {
                    const jobDetailsUrl = `https://app.loxo.co/api/pinnacle-recruitment-services/jobs/${job.id}`;
                    const detailsResponse = await fetch(jobDetailsUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${process.env.LOXO_TOKEN}`,
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    });
                    if (!detailsResponse.ok) {
                        console.error(`Error fetching details for job ${job.id}: ${detailsResponse.status}`);
                        return { ...job, description: null }; // Return job with null description if details fetch fails
                    }
                    const jobDetails = await detailsResponse.json();
                    return {
                        ...job,
                        description: jobDetails.description || 'No description available'
                    };
                } catch (error) {
                    console.error(`Error fetching details for job ${job.id}:`, error.message);
                    return { ...job, description: null }; // Handle individual job detail errors gracefully
                }
            })
        );

        // Replace results with detailed jobs
        const responseData = {
            ...data,
            results: detailedJobs
        };

        // Log response details
        console.log('Detailed response at:', new Date().toISOString(), 'Page:', page, 'Data count:', responseData.results?.length || 'No results');
        res.set('Cache-Control', 'no-cache');
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching Loxo data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is on');
});
