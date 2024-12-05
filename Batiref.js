// Apify scraper for Batiref reviews

const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();
    const baseUrl = input.baseUrl || 'https://www.batiref.fr/pro/megacombles';

    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: baseUrl });

    const dataset = await Apify.openDataset();

    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageFunction: async ({ $, request }) => {
            console.log(`Processing ${request.url}`);

            const reviews = $('.bloc-avis').map((i, el) => {
                const review = $(el);
                return {
                    author: review.find('.avis-avatar .infos span').text().trim(),
                    date: review.find('.avis-date').text().trim().replace('Avis publié le ', ''),
                    rating: parseInt(review.find('.note-rating-1').text().trim().split('/')[0]),
                    comment: review.find('.avis-commentaire').text().trim(),
                    details: {
                        quality: parseInt(review.find('.note-rating-2').eq(0).text().trim().split('/')[0]),
                        delay: parseInt(review.find('.note-rating-2').eq(1).text().trim().split('/')[0]),
                        price: parseInt(review.find('.note-rating-2').eq(2).text().trim().split('/')[0]),
                        reliability: parseInt(review.find('.note-rating-2').eq(3).text().trim().split('/')[0]),
                        courtesy: parseInt(review.find('.note-rating-2').eq(4).text().trim().split('/')[0]),
                        workDate: review.find('.bloc-travaux p').eq(0).text().trim(),
                        workDuration: review.find('.bloc-travaux p').eq(1).text().trim(),
                    }
                };
            }).get();

            await dataset.pushData(reviews);

            // Pagination
            const nextPageLink = $('.pagination a:contains(>)').attr('href');
            if (nextPageLink) {
                const nextPageUrl = new URL(nextPageLink, request.loadedUrl).href;
                await requestQueue.addRequest({ url: nextPageUrl });
            }
        },
        maxRequestsPerCrawl: 40 // Ajusta según el número de páginas
    });

    await crawler.run();

    console.log('Scraping finished.');
});
