   try {
    let allJobs = [];
    let page = 1;
    let nextPageUrl = apiUrl; // Start with the initial API URL

    // Loop to fetch all pages
    while (nextPageUrl) {
        const response = await fetch(nextPageUrl, {
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

        // Fetch descriptions for each job in the current page
        const jobsWithDescriptions = await Promise.all(data.results.map(async (job) => {
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

        // Add jobs from this page to the cumulative list
        allJobs = [...allJobs, ...jobsWithDescriptions];

        // Log response details for this page
        console.log('API response at:', new Date().toISOString(), 'Page:', page, 'Data count:', jobsWithDescriptions.length);

        // Check for next page
        if (data.pagination && data.pagination.next_page_url) {
            nextPageUrl = data.pagination.next_page_url; // Use the next page URL if provided
            page++;
        } else {
            nextPageUrl = null; // Exit loop if no more pages
        }
    }

    // Log all jobs
    allJobs.forEach(job => {
        console.log(`Job ID: ${job.id}, Title: ${job.title}, Description: ${job.description || 'Not available'}`);
    });

    res.set('Cache-Control', 'no-cache');
    res.json({
        results: allJobs,
        pagination: { total: allJobs.length } // Adjust based on API's pagination structure
    });
} catch (error) {
    console.error('Error fetching Loxo data:', error.message);
    res.status(500).json({ error: error.message });
}
