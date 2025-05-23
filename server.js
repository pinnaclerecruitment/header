// Base API URL
const baseUrl = 'https://app.loxo.co/api/pinnacle-recruitment-services/jobs?status=active&published=true';

// Function to fetch job descriptions for up to 20 pages
async function fetchJobDescriptions() {
  try {
    const maxPages = 20;
    const allJobs = [];

    // Step 1: Fetch jobs from up to 20 pages
    for (let page = 1; page <= maxPages; page++) {
      const response = await fetch(`${baseUrl}&page=${page}`, {
        headers: {
          // Add authentication headers if required
          // 'Authorization': 'Bearer YOUR_API_TOKEN'
        }
      });
      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.status}`);
        break; // Stop if the page fails (e.g., no more pages)
      }
      const data = await response.json();
      allJobs.push(...data.results);

      // Stop if there are no more pages
      if (page >= data.total_pages || !data.results.length) {
        console.log(`Reached end of pages at page ${page}`);
        break;
      }
    }

    // Step 2: Fetch descriptions for each job
    const promises = allJobs.map(async (job) => {
      const response = await fetch(job.public_url, {
        headers: {
          // Add authentication headers if required
          // 'Authorization': 'Bearer YOUR_API_TOKEN'
        }
      });
      if (!response.ok) {
        console.error(`Failed to fetch description for job ${job.title}: ${response.status}`);
        return {
          title: job.title,
          description: 'Description not found'
        };
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

    console.log(`Fetched descriptions for ${results.length} jobs across ${Math.min(maxPages, allJobs.length / 25 + 1)} pages`);
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
  }
}

// Run the function
fetchJobDescriptions();
