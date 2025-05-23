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
        let allJobs = [];
        let page = 1;
        let totalPages = 1;

        // Fetch all pages of active and published jobs
        while (page <= totalPages) {
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
            
            // Update total pages and append jobs
            totalPages = data.pagination?.total_pages || 1;
            allJobs = [...allJobs, ...(data.results || [])];
            
            console.log(`Fetched page ${page} of ${totalPages}, jobs: ${data.results?.length || 0}`);
            page++;
            
            // Optional: Add delay to avoid rate limits (adjust as needed)
            if (page <= totalPages) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
            }
        }

        // Fetch descriptions for each job (limit concurrent requests to avoid rate limits)
        const jobsWithDescriptions = await Promise.all(allJobs.map(async (job) => {
            try {
                const jobDetailUrl = `https://app.loxo.co/api/pinnacle-recruitment-services/jobs/${job.id}`;
                const jobResponse = await fetch(jobDetailUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.LOXO_TOKEN}`,
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                if (!jobResponse.ok) {
                    console.error(`Failed to fetch details for job ${job.id}: ${jobResponse.status}`);
                    return { ...job, description: null };
                }
                const jobData = await jobResponse.json();
                return {
                    id: job.id,
                    title: job.title,
                    description: jobData.description || null,
                    public_url: job.public_url,
                    status: job.status,
                    published: job.published,
                    company: job.company,
                    macro_address: job.macro_address,
                    salary: job.salary
                };
            } catch (error) {
                console.error(`Error fetching description for job ${job.id}:`, error.message);
                return { ...job, description: null };
            }
        }));

        // Log response details
        console.log('API response at:', new Date().toISOString(), 'Total jobs:', jobsWithDescriptions.length);
        jobsWithDescriptions.forEach(job => {
            console.log(`Job ID: ${job.id}, Title: ${job.title}, Description: ${job.description || 'Not available'}`);
        });

        res.set('Cache-Control', 'no-cache');
        res.json({
            results: jobsWithDescriptions,
            total_count: jobsWithDescriptions.length,
            fetched_at: new Date().toISOString()
        });
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
        console.log('Job fetched at:', new Date().toISOString(), 'Job ID:', jobId, 'Title:', data.title, 'Description:', data.description || 'Not available', 'Public URL:', data.public_url);
        // Verify job is active and published
        if (data.status !== 'active' || !data.published) {
            return res.status(404).json({ error: `Job with ID ${jobId} is not active or published` });
        }
        res.set('Cache-Control', 'no-cache');
        res.json({
            id: data.id,
            title: data.title,
            description: data.description || null,
            public_url: data.public_url,
            status: data.status,
            published: data.published,
            company: data.company,
            macro_address: data.macro_address,
            salary: data.salary
        });
    } catch (error) {
        console.error('Error fetching Loxo job:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is on');
});
