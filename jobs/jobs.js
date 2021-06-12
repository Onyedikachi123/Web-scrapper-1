const redis = require('redis');
let client = redis.createClient(process.env.REDIS_URL, { no_ready_check: true });
const pageScraper = require('../scrapper/pageScrapper');
const puppeteerBrowser = require('../scrapper/browser');
const analyzeReviews = require('../util/analyzeReviews');

const scrapeProcess = async ({ data }) => {
    try {
        let { company_name, _badPageId, _goodPageId } = data;
        let browser = await puppeteerBrowser();
        let { reviews, numberReviews } = await pageScraper.scrapper.glassdoor_scrapper(browser, company_name);

        let response = await pageScraper.scrapper.indeed_scrapper( browser, company_name, false );
        let gld_reviews = numberReviews.toString().split("K");
        let ind_reviews = response.numberReviews.toString().split("K");
        numberReviews = +gld_reviews[0] + +ind_reviews[0];
        let { goodComments, badComments } = analyzeReviews([...reviews, ...response.reviews], numberReviews); 


        let goodPercent = ((goodComments.length / (goodComments.length + badComments.length)) * 100).toFixed(2) || 0;
        let badPercent = (100 - goodPercent).toFixed(2) || 0;

        if(gld_reviews.length > 1 || ind_reviews.length > 1){
            numberReviews += "K" 
        }
        
        client.setex(company_name,3600, JSON.stringify({
            company_name,
            goodPercent,
            goodPageId: _goodPageId,
            badPageId: _badPageId,
            badPercent,
            comments: { badComments, goodComments },
            reviewStatus: "ACT",
            numberReviews: numberReviews || 0,
        }));
        // console.log(job.id);

    } catch (error) {
        console.log(error)
    }
}
module.exports = scrapeProcess;

