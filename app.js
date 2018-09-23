const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rp = require('request-promise');
const request = require('request');
const PORT = 6653;
const blockchain_ip = 'http://localhost:3002';
// const blockchain_ip = 'http://35.237.108.201:3002';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
    res.json({
        note: `You've reached the CarChain Simplified Endpoint`,
        availableRoutes: [
            { '/blocks/:amount?': `Get 'amount' of blocks starting from oldest. Default is 20.` },
            { '/lastBlocks/:amount?': `Same as above, but starting from latest` },
            { '/car/:plate': `Get all blocks where 'carPlate' equals 'plate'` },
            { '/car/timeSeries/:plate': `Returns a time series of the 'plate' car data` },
            { '/car/timeSeries/sum/:plate': `Same as above, but the values are aggregated in a sum` }
        ]
    });
});

function getBlockchainTillPage(currentPage, numOfPages, chain, callback) {
    request(`${blockchain_ip}/blockchain/${currentPage}`, function (err, res, body) {
        body = JSON.parse(body);
        chain = chain.concat(body['chain']);

        if (currentPage < numOfPages && body["nextUrl"] !== "none") {
            getBlockchainTillPage(currentPage+1, numOfPages, chain, callback);
        } else {
            callback(chain);
        }
    });
}

app.get('/blocks/:amount?', (req, res) => {
    const amount = !!req.params.amount ? req.params.amount : 20;       // 20 is default
    const pages = Math.ceil(amount / 100);

    getBlockchainTillPage(0, pages, [], (chain) => {
        res.json({
            note: `Request for first ${amount} blocks`,
            blocks: chain.slice(0, amount)
        });
    });
});

function getBlockchainTillPageBackwards(currentPage, stopPage, chain, callback) {
    request(`${blockchain_ip}/blockchain/${currentPage}`, function (err, res, body) {
        body = JSON.parse(body);
        chain = chain.concat(body['chain'].reverse());

        if (currentPage > stopPage && body["previousUrl"] !== "none") {
            getBlockchainTillPageBackwards(currentPage-1, stopPage, chain, callback);
        } else {
            callback(chain);
        }
    });
}

app.get('/lastBlocks/:amount?', (req, res) => {
    const amount = !!req.params.amount ? req.params.amount : 20;       // 20 is default
    const pages = Math.ceil(amount / 100);

    request(`${blockchain_ip}/blockchain/size`, function (err, resp, body) {
        body = JSON.parse(body);
        const lastPage = Math.floor(body['blockchainLength']/100);
        const stopPage = lastPage - pages;

        getBlockchainTillPageBackwards(lastPage, stopPage, [], (chain) => {
            res.json({
                note: `Request for last ${amount} blocks`,
                blocks: chain.slice(0, amount)
            });
        });
    });
});

function getCarBlocks(plate, callback) {
    request(`${blockchain_ip}/blockchain/0`, (err, res, body) => {
        body = JSON.parse(body);
        const numOfPages = body['totalPages'];

        const promisesArr = [];
        for (var i = 0; i < numOfPages; i++) {
            promisesArr.push(rp(`${blockchain_ip}/blockchain/${i}`));
        }

        Promise
            .all(promisesArr)
            .then(responseArr => {
                var chain = [];

                responseArr.forEach(body => {
                    body = JSON.parse(body);
                    body['chain'].forEach(block => {
                        if (block['carPlate'] == plate) {
                            chain.push(block);
                        }
                    });
                });

                callback(chain);
            }).catch((err) => {
                console.log(`Error getting data for car ${plate}`);
                console.log(err);
            });
    });
}

app.get('/car/:plate', (req, res) => {
    const carPlate = req.params.plate;

    getCarBlocks(carPlate, (blocks) => {
        res.json({
            note: `Request for car ${carPlate}`,
            carPlate: carPlate,
            numOfBlocks: blocks.length,
            blocks: blocks 
        });
    });
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});