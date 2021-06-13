const GET_REVIEWS = async (page, reviews) => {
    try {
        await page.waitForSelector('.empReview');
        await page.waitForSelector('.mt-xxsm');
        const reviewContent = await page.$$eval(".mt-xxsm", reviewContent => reviewContent.map(comment => comment.innerText.trim()));
        if (reviewContent.length > 0) {

            reviewContent.forEach(el => {
                let id = Math.random() * Math.random() * 1000000;
                let reviewDetail = el.split('\n');
                if(reviewDetail[0] && reviewDetail[8]){
                    reviews.push({
                        id,
                        title: reviewDetail[0],
                        employee: reviewDetail[1],
                        comment: reviewDetail[8] + " " + reviewDetail[12],
                        scrapper: "glassdoor.com"
                    });
                }
            });
        }
        return reviews
    } catch (error) {
        console.log(error)
    }

}

const GLASSDOOR_SCRAPPER = async (browser, company_name) => {

    try {
        let review_link = `https://www.glassdoor.com/member/home/companies.htm`
        let url = new URL(`https://www.glassdoor.com/Search/results.htm?keyword=${company_name}`)
        let page = await browser.newPage();
        
        await page.setDefaultTimeout(0);

        //set user agent to prevent the site from treating this scrapper as a bot;
        const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
        await page.setUserAgent(userAgent);
        //turns request interceptor on
        // await page.setRequestInterception(true);
        // //if the page makes a  request to a resource type of image or stylesheet then abort that            request

        // page.on('request', request => {
        //     if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet')
        //         request.abort();
        //     else
        //         request.continue();
        // });
        console.log(`Navigating to ${review_link}...`);

        await page.goto(review_link);
        await page.waitForNavigation();
         console.log(`gone to ${review_link}`);
        await page.waitForSelector("#userEmail"); 
        
        //user login
        await page.type("#userEmail", process.env.GLASSDOOR_EMAIL);
        console.log(`entered the user mail`);
        await page.type("#userPassword", process.env.GLASSDOOR_PASS);
        console.log(`entered the user pass`);
        await page.click(`
                 #InlineLoginModule > div > div > div > div:nth-child(2) > 
                 div:nth-child(4) > form > div.mt-std.d-flex.flex-column.align-items-center > 
                 div:nth-child(1) > button
                 `);//
console.log(`logged in`);
        await page.waitForNavigation();
        await page.goto(url.href);

        await page.waitForSelector('.company-tile');
        const company_tile = await page.$('.company-tile');
        if (!company_tile) {
            return { reviews: [], numberReviews: 0 }
        }
        await company_tile.click();
        await page.waitForSelector('.eiCell.cell.reviews');
        let hasReviews = await page.$("#EIProductHeaders > div > a.eiCell.cell.reviews > span.num.eiHeaderLink");
        if (!hasReviews) {
            return { reviews: [], numberReviews: 0 }
        }
        let numberReviews = await page.$eval("#EIProductHeaders > div > a.eiCell.cell.reviews > span.num.eiHeaderLink", count => count.innerText);
        const reviews_link = await page.$('.eiCell.cell.reviews');
        await reviews_link.click('.eiCell.cell.reviews');
        let nextBtn;

        await page.waitForNavigation();
        let reviews = []
        const [totalReviews, other] = numberReviews.split("k");

        let __numberReviews = other === "" ? totalReviews * 1000 : totalReviews;
        if (__numberReviews > 10) {
            nextBtn = await page.$('.nextButton');
        }
        reviews = await GET_REVIEWS(page, []);
        let __reviews;
        let updatedReviews = [...reviews]


        const percentage = 0.5;
        const percentile = __numberReviews >= 1000 ? percentage * __numberReviews : __numberReviews;
        const divisor = percentile *0.1
        const numLinks = Math.floor(percentile / divisor);

      

        for (let index = 1; index <= numLinks; index++) {
            await page.waitForSelector('.nextButton.css-sed91k')
            nextBtn = await page.$('.nextButton.css-sed91k');
            nextBtn.click();
            __reviews = await GET_REVIEWS(page, []);
            updatedReviews.push(__reviews)
        }
        reviews = Array.from(updatedReviews).flat();
        console.log("done - glassdoor")
        return { reviews, numberReviews: __numberReviews > reviews.length ? numberReviews.replace("k","K") : reviews.length.toString() };

        // return {reviews : [], numberReviews: null}
    } catch (error) {
       throw error
    }
}

module.exports = { GLASSDOOR_SCRAPPER };
