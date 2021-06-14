// const scrapeReviews = require("../util/scrapeReviews");
const setClient = require('../util/setClient');
const getReviews = require('../util/getReviews');
const redis = require('redis');
const puppeteerBrowser = require('../scrapper/browser');
const analyzeReview = require('../util/analyzeReviews');
const pageScraper = require('../scrapper/pageScrapper');
let client = redis.createClient(process.env.REDIS_URL, { no_ready_check: true });
const NUM_OF_COMMENTS_PER_PAGE = 10;

const scrapeReviews = async ({ res, company_name, _badPageId, _goodPageId }) => {

    const START_INDEX_GD_COMMENTS = (NUM_OF_COMMENTS_PER_PAGE * +_goodPageId) - NUM_OF_COMMENTS_PER_PAGE;
    const START_INDEX_BD_COMMENTS = (NUM_OF_COMMENTS_PER_PAGE * +_badPageId) - NUM_OF_COMMENTS_PER_PAGE;

    client.get(company_name, async (err, data) => {
        if (err) {
            console.log(err);
        }
        //scrape for comments if data does not exist on the redis cache
        if (!data) {
            let { goodComments, badComments, numberReviews } = await getReviews({
                company_name,
                _badPageId,
                _goodPageId,
                isFirstScrape: true,
                Page: 1
            });

            let goodPercent = ((goodComments.length / (goodComments.length + badComments.length)) * 100).toFixed(2) || 0;
            let badPercent = (100 - goodPercent).toFixed(2) || 0;

            //stores scrapped results/reviews on redis 
            setClient(company_name, {
                company_name,
                comments: { badComments, goodComments },
                goodPercent: 0,
                goodPageId: _goodPageId,
                badPageId: _badPageId,
                badPercent: 0,
                reviewStatus: "PEN",
                numberReviews: ""
            });

            //sends reviews to user 
            res.status(200).json({
                comments: {
                    goodComments: goodComments.splice(START_INDEX_GD_COMMENTS, NUM_OF_COMMENTS_PER_PAGE),
                    badComments: badComments.splice(START_INDEX_BD_COMMENTS, NUM_OF_COMMENTS_PER_PAGE)
                },
                numberReviews: "",
                goodPageId: _goodPageId,
                badPageId: _badPageId,
                goodPercent: "",
                badPercent: "",
                reviewStatus: "PEN"
            })
        } else {
            data = JSON.parse(data);

            let _goodComments = data.comments.goodComments.splice(START_INDEX_GD_COMMENTS, NUM_OF_COMMENTS_PER_PAGE);
            let _badComments = data.comments.badComments.splice(START_INDEX_BD_COMMENTS, NUM_OF_COMMENTS_PER_PAGE);

            // if comments/reviews have not been populated, get the next reviews;
            //if number of reviews is not greater than 20 * page, check glassdoor;



            res.status(200).json({
                ...data,
                goodPageId: _goodPageId,
                badPageId: _badPageId,
                comments: {
                    goodComments: _goodComments,
                    badComments: _badComments
                }
            });
        }
    })

}

exports.getComments = async (req, res, next) => {
    try {
        const company_name = req.body.company_name.trim();
        // const pageId = +req.query.pageId;
        let _goodPageId = +req.query.goodPageId;
        let _badPageId = +req.query.badPageId;

        //check if expected params are sent
        if (!company_name) {
            const err = new Error('Kindly enter a company name');
            err.status = 422;
            throw err;
        }

        if (!_goodPageId) {
            _goodPageId = 1;
        }

        if (!_badPageId) {
            _badPageId = 1;
        }
        await scrapeReviews({ res, company_name, _badPageId, _goodPageId });
    } catch (error) {
        // console.log("Could not resolve the browser instance => ", error);
        if (!error.status) {
            error.status = 500;
            error.message = "Could not resolve the browser instance";
        }
        next(error);
    }
}


exports.getMore = async (req, res, next) => {
    try {
        let { company_name, goodPageId, badPageId } = req.query
        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };
        //check if expected params are sent
        if (!company_name) {
            const err = new Error('Kindly enter a company name');
            err.status = 422;
            throw err;
        }

        if (!goodPageId) {
            goodPageId = 1;
        }

        if (!badPageId) {
            badPageId = 1;
        }

        client.get(company_name, (err, data) => {
            if (err) {
                throw err;
            }
            if (data) {
                let { comments: { goodComments, badComments }, reviewStatus } = JSON.parse(data);

                const START_INDEX_GD_COMMENTS = (NUM_OF_COMMENTS_PER_PAGE * +goodPageId) - NUM_OF_COMMENTS_PER_PAGE;
                const START_INDEX_BD_COMMENTS = (NUM_OF_COMMENTS_PER_PAGE * +badPageId) - NUM_OF_COMMENTS_PER_PAGE;

                res.writeHead(200, headers);

                res.write(`data: ${JSON.stringify({
                    comments: {
                        goodComments: goodComments.splice(START_INDEX_GD_COMMENTS, NUM_OF_COMMENTS_PER_PAGE),
                        badComments: badComments.splice(START_INDEX_BD_COMMENTS, NUM_OF_COMMENTS_PER_PAGE)
                    },
                    reviewStatus
                })}\n\n`);
                res.end();
            } else {
                res.writeHead(200, headers);
                res.write(`data: ${JSON.stringify(data)} \n\n`);

                res.end();
            }
        })


    } catch (error) {
        // console.log("Could not resolve the browser instance => ", error);
        if (!error.status) {
            error.status = 500;
            
        }
        next(error);
    }
}
exports.getReviews = async (req, res, next) => {
    let company_name = req.query.company_name;

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };

    client.get(company_name, (err, data) => {
        if (err) {
            throw err;
        }
        if (data) {
            let {
                numberReviews,
                goodPercent,
                badPercent,
                reviewStatus
            } = JSON.parse(data)

            res.writeHead(200, headers);

            res.write(`data: ${JSON.stringify({
                numberReviews,
                goodPercent,
                badPercent,
                reviewStatus
            })}\n\n`);
            res.end();
        } else {
            data = {
                numberReviews: "",
                goodPercent: 0,
                badPercent: 0,
                reviewStatus:"PEN"
            }
            res.writeHead(200, headers);
            res.write(`data: ${JSON.stringify(data)} \n\n`);

            res.end();
        }
    })

}