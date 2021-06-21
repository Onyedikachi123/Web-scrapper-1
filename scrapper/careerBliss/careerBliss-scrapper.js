const CAREER_BLISS_URI = require('../../config/config').CAREER_BLISS_URI;


module.exports = {
    CAREER_BLISS_SCRAPPER: async (browser, company_name) => {
        try {
            let review_link = `https://www.careerbliss.com/${company_name}/reviews/`;
            let page = await browser.newPage();
            await page.setDefaultTimeout(50000);
            //set user agent to prevent the site from treating this scrapper as a bot;
            const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
            await page.setUserAgent(userAgent);
            //turns request interceptor on

            await page.setRequestInterception(true);
            //if the page makes a  request to a resource type of image or stylesheet then abort that            request
            page.on('request', request => {
                if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet')
                    request.abort();
                else
                    request.continue();
            });
            console.log(`Navigating to ${review_link}...`);
            const response = await page.goto(review_link);


            //const hasNoReviews = await page.$eval(".noresult.ng-scope", noReview => noReview);
            if (response._status === 200) {
                let numberReviews = await page.$eval(".review-count", numReviews => (numReviews.innerText.split(" reviews")[0].replace("(", "")));
                const [th, hun] = numberReviews.split(",");
                if (hun) {
                    numberReviews = Number.parseInt(th + hun);
                }  
               
                  

                const reviews = [];
                const percentage = 0.5;
                const percentile = numberReviews >= 1000 ? percentage * numberReviews : numberReviews;
                const divisor = percentile * 0.1
                const numLinks = Math.floor(percentile / divisor);

                for (let index = 2; index <= numLinks; index++) {
                    await page.goto(`https://www.careerbliss.com/${company_name}/reviews/?page=${index}`);
                    const contents = await page.$$eval(".company-reviews", reviewcontents => {


                        return reviewcontents
                            .map(comment => comment.innerText.trim())


                    });
                    
                    contents.forEach(el => {
                        let id = Math.random() * Math.random() * 10000; 
                        let [employee, location, emptyText, comment] = el.split('\n');
                        reviews.push({ id, employee: employee + " " + location, comment, scrapper: "CareerBliss.com" });
                    });
                    if (contents.length < 16) {
                        break;
                    }
                }
                numberReviews = hun ? th + "K" : numberReviews; 
                return { reviews, numberReviews };
            }
            return { reviews: [], numberReviews: 0 };

        } catch (error) {
            console.log(error);
        }
    }
}
