const router = require('express').Router(); 
const scrapperController = require('../controller/scrapper-controller.js'); 

router.get('/comments/totalreviews',scrapperController.getReviews);
router.get('/comments/more',scrapperController.getMore);
router.post('/comments',scrapperController.getComments);

module.exports = router;