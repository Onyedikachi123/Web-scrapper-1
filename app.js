const express = require('express');
const config = require('./config/config.js');
const cors = require('cors');
const scrapperRoute = require('./routes/scrapper-route.js');
const { PORT } = require('./config/config.js');
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || 6379; 

const client = redis.createClient(REDIS_URL);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());


app.use('/scrapper-api/v1',scrapperRoute);

app.use((error, req, res, next) => {
    res.status(error.status).json({
        ...error
    });
})

app.listen(config.PORT, (err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log('connected on port:' + PORT);
})