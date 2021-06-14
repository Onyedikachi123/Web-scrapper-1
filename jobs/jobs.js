const redis = require('redis');
let client = redis.createClient(process.env.REDIS_URL, { no_ready_check: true });
const pageScraper = require('../scrapper/pageScrapper');
const puppeteerBrowser = require('../scrapper/browser');
const analyzeReviews = require('../util/analyzeReviews');

const scrapeProcess = async ({ data }) => {
    try {
        console.log("started-job")
        let { company_name, _badPageId, _goodPageId } = data;
        let browser = await puppeteerBrowser();
        let {reviews, numberReviews} = await pageScraper.scrapper.career_scrapper(browser, company_name)

            console.log("analyzing-reviews")
            let response = await pageScraper.scrapper.indeed_scrapper( browser, company_name, false );
            let gld_reviews = numberReviews.toString().split("K");
            let ind_reviews = response.numberReviews.toString().split("K");
            numberReviews = +gld_reviews[0] + +ind_reviews[0];
            console.log("analyzing-reviews")
            let { goodComments, badComments } = analyzeReviews([...reviews, ...response.reviews], numberReviews); 
            console.log("analyzing-reviews-finshed")
            console.log("calculating-percentage")
           
            console.log("calculated-percentage")
    
            if(gld_reviews.length > 1 || ind_reviews.length > 1){
                numberReviews += "K" 
            }
            console.log("storing in redis")

            client.get(company_name, (err, data)=> {
                if(err){
                    console.log(error)
                }

                if(data){

                    let {comments} = JSON.parse(data); 
                    
                    let _badComments =  [...comments.badComments, ...badComments];
                    let _goodComments =  [...comments.goodComments, ...goodComments];
                    let goodPercent =  0;
                    let badPercent =  0;

                    if(_goodComments.length + _badComments.length > 0){
                       goodPercent = ((_goodComments.length / (_goodComments.length + _badComments.length)) * 100).toFixed(2) || 0;
                        badPercent = (100 - goodPercent).toFixed(2) || 0;
                    }
                    
                    client.setex(company_name,3600, JSON.stringify({
                        company_name,
                        goodPercent: goodPercent || 0,
                        goodPageId: _goodPageId,
                        badPageId: _badPageId,
                        badPercent: badPercent || 0 ,
                        comments: { badComments : _badComments, goodComments: _goodComments },
                        reviewStatus: "ACT",
                        numberReviews: numberReviews || 0,
                    }));
                }else{
                    client.setex(company_name,3600, JSON.stringify({
                        company_name,
                        goodPercent,
                        badPercent,
                        comments: { badComments, goodComments },
                        goodPageId: _goodPageId,
                        badPageId: _badPageId,
                        reviewStatus: "ACT",
                        numberReviews: numberReviews || 0,
                    }));
                }

                console.log("completed job");   

            })
    
           
            // console.log(job.id);

    } catch (error) {
        console.log(error)
    }
}
module.exports = scrapeProcess;

