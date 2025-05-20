// These are tools to make your webservice work
const express = require('express');
const axios = require('axios');
const app = express();

// This is where your webservice "lives" on Render
const PORT = process.env.PORT || 3000;

// This is your secret Loxo API key, stored in Render as LOXO_TOKEN
const LOXO_TOKEN = process.env.LOXO_TOKEN;

// This is the "door" people visit to get job data
app.get('/loxo-data', async (req, res) => {
  try {
    // Ask Loxo for only active jobs
    const response = await axios.get('https://app.loxo.co/pinnacle-recruitment-services/jobs?status=active', {
      headers: {
        Authorization: `Bearer ${LOXO_TOKEN}` // Use your key to unlock Loxo’s data
      }
    });

    // Get the list of jobs (Loxo often puts them in a "data" field)
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
    // If something breaks, tell the visitor and log the problem
    console.error('Error:', error.message);
    res.status(500).send('Oops, something went wrong!');
  }
});

// Start the webservice
app.listen(PORT, () => {
  console.log(`Webservice is running on port ${PORT}`);
});
