const CAREER_BLISS_URI = require('../../config/config').CAREER_BLISS_URI;


module.exports = {
    CAREER_BLISS_SCRAPPER: async (browser, company_name) => {
        try {
            let review_link = `https://www.careerbliss.com/search/?q=${company_name}&l=&typeFilter=review&sf=true`;
            let page = await browser.newPage();
            await page.setDefaultTimeout(0);
            //set user agent to prevent the site from treating this scrapper as a bot;
            const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
            await page.setUserAgent(userAgent);
            console.log(`Navigating to ${review_link}...`);
            await page.goto(review_link);
            //turns request interceptor on
            await page.setRequestInterception(true);
            //if the page makes a  request to a resource type of image or stylesheet then abort that            request
            page.on('request', request => {
                if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet')
                    request.abort();
                else
                    request.continue();
            });
            const hasNoReviews = await page.$(".noresult.ng-scope");
            if(!hasNoReviews){
    
            const numberReviews = await page.$eval(".ng-binding", numReviews => numReviews.innerText.split("of ")[1].split(" ")[0]);

            const reviews = []; 
            const percentage = 0.2;
            const percentile = numberReviews <= 200 ?  percentage * numberReviews : 100

            const numLinks = Math.floor(percentile/20); 

            for (let index = 0; index <= numLinks; index++) {
                    await page.goto(`https://www.careerbliss.com/search/?q=${company_name}&typeFilter=review&page=${index}&jid=`); 
                   
                    const contents =  await page.$$eval(".result.review",  reviewcontents => {
                    
                        
                        return reviewcontents
                            .map(comment => comment.innerText.trim())
                            
                            
                    });
                    contents.forEach(el => {
                        let id = Math.random() * Math.random() * 10000;
                        let [employee, comment] = el.split('\n');
                        reviews.push({ id, employee, comment ,  scrapper : "CareerBliss.com"});
                    });
                }
          
                return {reviews, numberReviews};
            }
                return {reviews:[], numberReviews: null};
                
        } catch (error) {
            throw error
        }
    }
}
