const indeed_uri = require('../../config/config').INDEED_URI;



module.exports = {
    INDEED_SCRAPPER: async (browser, company_name) => {

        try {
            let review_link = `https://www.indeed.com/cmp/${company_name}/reviews`
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
                const getRev = await page.$(".cmp-CompactHeaderMenuItem-count");
                if(getRev){

                
                const numberReviews = await page.$eval(".cmp-CompactHeaderMenuItem-count", count => count.innerText);

            const reviews = [];
            const percentage = 0.2;
            const percentile = numberReviews <= 200 ? percentage * numberReviews : 100

            const numLinks = Math.floor(percentile / 20);

            for (let index = 0; index <= numLinks; index++) {
                await page.goto(`https://www.indeed.com/cmp/${company_name}/reviews?start=${20 * index}`);

                const contents = await page.$$eval("div.cmp-Review-content", reviewcontents => {


                    return reviewcontents
                        .map(comment => comment.innerText.trim())

                });
                contents.forEach(el => {
                    let id = Math.random() * Math.random() * 10000;
                    let [title, employee, comment] = el.split('\n');
                    //split title for date
                    let employeeData = employee.split('-');

                   let year = employeeData[employeeData.length - 1]
                    .split(',')[1];
                    reviews.push({ id, year, title, employee, comment, scrapper : "indeed.com" });
                });
            }
            reviews.sort((a, b)=> b.year - a.year ); 
            return { reviews, numberReviews };
        }
        return {reviews : [], numberReviews: null}
        } catch (error) {
            throw error
        }
    }
}
