// These are like tools to build your webservice
const express = require('express');
const axios = require('axios');
const app = express();

// This is the "address" where your webservice lives on Render
const PORT = process.env.PORT || 3000;

// This is your secret Loxo API key, stored safely in Render
const LOXO_API_KEY = process.env.LOXO_API_KEY;

// This is the "door" people knock on to get job data
app.get('/loxo-data', async (req, res) => {
  try {
    // Ask Loxo for only active jobs
    const response = await axios.get('https://app.loxo.co/pinnacle-recruitment-services/jobs?status=active', {
      headers: {
        Authorization: `Bearer ${LOXO_API_KEY}` // Your key to unlock Loxo’s data
      }
    });

    // Get the list of jobs (Loxo usually puts them in a "data" field)
    const jobs = response.data.data || response.data;

    // Pick only the fields you want
    const filteredJobs = jobs.map(job => ({
      published_name: job.published_name || 'N/A',
      macro_address: job.macro_address || 'N/A',
      public_url: job.public_url || 'N/A',
      job_tag: job.job_tag || 'N/A'
    }));

    // Send the filtered jobs to the visitor
    res.json(filteredJobs);
  } catch (error) {
    // If something breaks, tell the visitor there’s a problem
    console.error('Error:', error.message);
    res.status(500).send('Oops, something went wrong!');
  }
});

// Start the webservice
app.listen(PORT, () => {
  console.log(`Webservice is running on port ${PORT}`);
});
