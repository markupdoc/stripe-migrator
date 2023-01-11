// read customer data from data/customer.csv

const fs = require('fs');
const { parse } = require('csv-parse');
const { addDays, getUnixTime } = require('date-fns');
require('dotenv').config();

let results = [];

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_STG);
const priceId = process.env.STRIPE_SUB_PRICE_STG;

fs.createReadStream('data/customer.csv')
  .pipe(parse({ delimiter: ',' }))
  .on('data', (data) => {
    const customerDaysInSub = parseInt(data[24]);
    const status = customerDaysInSub >= 315 ? 'expired' : 'active';
    results.push({
      createdDate: new Date(data[3]),
      customerId: data[14],
      status: status,
    });
  })
  .on('end', () => {
    // if status is expired, create subscription for 19.95, start date 30/01/2023 and free trial up to createdDate + 1 month
    for (let i = 0; i < results.length; i++) {
      try {
        if (results[i].status === 'active') {
          // create subscription for 19.95, start date 30/01/2023 and free trial up to createdDate + 1 year
          let createdDate = results[i].createdDate;
          let trialEnd = addDays(results[i].createdDate, 365);
          const trialEndTs = Math.floor(trialEnd.getTime() / 1000);
          const subscription = stripe.subscriptions.create({
            customer: results[i].customerId,
            items: [
              {
                price: priceId,
              },
            ],
            trial_end: trialEndTs,
          });
        } else {
          // create subscription for 19.95, start date 30/01/2023 and free trial up today + 1 month
          const startDate = new Date('2023-01-30');
          const trialEnd = addDays(startDate, 30);
          const trialEndTs = Math.floor(trialEnd.getTime() / 1000);
          const subscription = stripe.subscriptions.create({
            customer: results[i].customerId,
            backdate_start_date: Math.floor(
              startDate.getTime() / 1000
            ),
            items: [
              {
                price: priceId,
              },
            ],
            trial_end: trialEndTs,
          });
        }
      } catch (error) {
        console.log(error, results[i].customerId);
      }
    }
  });
