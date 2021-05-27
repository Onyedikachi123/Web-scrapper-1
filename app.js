const express = require('express');
const config = require('./config/config.js'); 
const cors = require('cors');
const scrapperRoute = require('./routes/scrapper-route.js'); 

const app = express();

app.use(express.json()); 
app.use(express.urlencoded({extended: false}));

app.use(cors());

// app.use((req,res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Methods", "POST", "GET");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type", "Authorization");

//     next();
// })

app.use('/scrapper-api/v1', scrapperRoute);

app.use((error, req, res, next) => {
    res.status(error.status).json({
        error
    });
})

app.listen(config.PORT,(err)=>{
    if(err){
        console.log(err);
        return;
    }
    console.log('connected');
})