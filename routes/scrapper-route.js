const router = require('express').Router(); 
const scrapperController = require('../controller/scrapper-controller.js'); 

router.post('/comments',scrapperController.getComments);


module.exports = router;