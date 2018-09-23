# CarChain Simplified Endpoint
A simplified endpoint for retrieving Data from [CarChain](https://github.com/LRAbbade/PBFT)

### Available Routes:

```js
    availableRoutes: [
            { '/blocks/:amount?': `Get 'amount' of blocks starting from oldest. Default is 20.` },
            { '/lastBlocks/:amount?': `Same as above, but starting from latest` },
            { '/car/:plate': `Get all blocks where 'carPlate' equals 'plate'` },
            { '/car/timeSeries/:plate': `Returns a time series of the 'plate' car data` },
            { '/car/timeSeries/sum/:plate': `Same as above, but the values are aggregated in a sum` }
        ]
```
