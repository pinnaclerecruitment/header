// Your dataset (replace with your actual JSON data)
const dataset = {
  "current_page": 1,
  "total_pages": 4,
  "per_page": 25,
  "total_count": 79,
  "results": [
    // ... your dataset here (omitted for brevity, paste your full dataset here)
    {
      "id": 3220151,
      "title": "Accountant",
      "public_url": "https://app.loxo.co/job/NDEyLXJ5NzFuYjZvMmNvaGl6YWk=",
      // ... other fields
    },
    // ... other jobs
  ]
};

// Function to fetch job descriptions concurrently
async function fetchJobDescriptions() {
  try {
    const jobs = dataset.results;
    const promises = jobs.map(async (job) => {
      const response = await fetch(job.public_url, {
        headers: {
          // Add authentication headers if required (e.g., API token)
          // 'Authorization': 'Bearer YOUR_API_TOKEN'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${job.public_url}: ${response.status}`);
      }
      const jobDetails = await response.json();
      return {
        title: job.title,
        description: jobDetails.description || 'Description not found'
      };
    });

    const results = await Promise.all(promises);
    results.forEach(result => {
      console.log(`Job Title: ${result.title}`);
      console.log(`Description: ${result.description}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
  }
}

// Run the function
fetchJobDescriptions();
