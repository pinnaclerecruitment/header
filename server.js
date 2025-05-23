try {
    let allJobs = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `${apiUrl}?page=${page}`;
        const response = await fetch(url, {
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

        allJobs = [...allJobs, ...jobsWithDescriptions];

        console.log('API response at:', new Date().toISOString(), 'Page:', page, 'Data count:', jobsWithDescriptions.length);

        if (data.pagination && data.pagination.total_pages && page < data.pagination.total_pages) {
            page++;
        } else {
            hasMore = false;
        }
    }

    allJobs.forEach(job => {
        console.log(`Job ID: ${job.id}, Title: ${job.title}, Description: ${job.description || 'Not available'}`);
    });

    res.set('Cache-Control', 'no-cache');
    res.json({
        results: allJobs,
        pagination: { total: allJobs.length }
    });
} catch (error) {
    console.error('Error fetching Loxo data:', error.message);
    res.status(500).json({ error: error.message });
}
