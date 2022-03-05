const Web3 = require('web3');
const fs = require('fs');
require('dotenv').config();

const PROVIDER_LOCAL = process.env.PROVIDER_LOCAL;
const PROVIDER_LIVE = process.env.PROVIDER_LIVE;

// FOR TESTING ON LOCAL FORK
//const web3 = new Web3(PROVIDER_LOCAL);

// FOR EXECUTING ON LIVE NETWORK
const web3 = new Web3(PROVIDER_LIVE);

const limitOrdersJSON_data = fs.readFileSync('../../artifacts/contracts/limit-order/LimitOrders.sol/LimitOrders.json');
const LIMIT_ORDERS_ABI = JSON.parse(limitOrdersJSON_data).abi;

for(let i = 1; i < LIMIT_ORDERS_ABI.length; i++) {
    const element = LIMIT_ORDERS_ABI[i]
    if(element.type === 'event') {
        console.log(LIMIT_ORDERS_ABI[i])
        console.log(web3.eth.abi.encodeEventSignature(LIMIT_ORDERS_ABI[i]))
        console.log();
    }

}