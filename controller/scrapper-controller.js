const Sentiment = require('sentiment'); 
const sentiment = new Sentiment();

const pageScraper = require('../scrapper/pageScrapper'); 
const puppeteerBrowser = require('../scrapper/browser'); 
const NUM_OF_COMMENTS_PER_PAGE = 6;

exports.getComments = async (req, res, next) => {
    try {
        const company_name = req.body.company_name.trim(); 
        // const pageId = +req.query.pageId;
        let good_pageId = +req.query.goodPageId;
        let bad_pageId = +req.query.badPageId;


        if(!company_name){
            const err = new Error('Kindly enter a company name');
            err.status = 422; 
            throw err; 
        }

        if(!good_pageId){
            good_pageId = 1; 
        }

        if(!bad_pageId){
            bad_pageId = 1; 
        }

        
            let browser = await puppeteerBrowser();

            const START_INDEX_GD_COMMENTS = (NUM_OF_COMMENTS_PER_PAGE * +good_pageId) - NUM_OF_COMMENTS_PER_PAGE;
            const START_INDEX_BD_COMMENTS = (NUM_OF_COMMENTS_PER_PAGE * +bad_pageId) - NUM_OF_COMMENTS_PER_PAGE;
 
            let {reviews, numberReviews} = await pageScraper.scrapper.indeed_scrapper(browser, company_name);
            if(numberReviews < 20 || !numberReviews){
                let response = await pageScraper.scrapper.career_scrapper(browser, company_name);
                reviews.concat(response.reviews);
                numberReviews = +response.numberReviews + +numberReviews
            }
            let goodComments=[];
            let badComments=[];

            reviews.forEach(com => {
              let resp = sentiment.analyze(com.comment);
              if(resp.score < 1){
                  badComments.push(com); 
                  return; 
              }
              goodComments.push(com); 
            });

            const goodPercent = ((goodComments.length /  reviews.length) *100).toFixed(2);
            const badPercent= ((badComments.length /  reviews.length) *100).toFixed(2);
            
             const __goodComments = goodComments.splice(START_INDEX_GD_COMMENTS, NUM_OF_COMMENTS_PER_PAGE);
            const __badComments = badComments.splice(START_INDEX_BD_COMMENTS, NUM_OF_COMMENTS_PER_PAGE);

            
            
            res.status(200).json({
                comments: {
                    goodComments: __goodComments,
                    badComments: __badComments
                },
                totalReviews: numberReviews,
                goodPageId : good_pageId,
                badPageId : bad_pageId,
                goodPercent,
                badPercent
            })

    } catch (error) {
        console.log("Could not resolve the browser instance => ", error);
        if(!error.status){
            error.status = 500; 
        }
        next(error);
    }
}