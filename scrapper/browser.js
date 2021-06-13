const puppeteer = require('puppeteer');

const startBrowser = async () =>{
    try {
        let browser;
        console.log('opening the browser...'); 
        browser = puppeteer.launch({
             headless: false,
            args: ["--disable-setuid-sandbox","--no-sandbox"],
            'ignoreHTTPSErrors': true
        });
        return browser; 
    } catch (error) {
        console.log("Could not create a browser instance => : ", error);
    }
};

module.exports = startBrowser; 
