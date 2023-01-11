// read customer data from data/customer.csv

const fs = require('fs');
const { parse } = require('csv-parse');

const results = [];

fs.createReadStream('data/customer.csv')
  .pipe(parse({ delimiter: ',' }))
  .on('data', (data) =>
    results.push({
      createdDate: new Date(data[3]),
      customerId: data[14],
      customerDaysInSub: parseInt(data[24]),
    })
  )
  .on('end', () => {
    console.log(results);
    // call stripe api and create subscription using customerId and createdData
  });
