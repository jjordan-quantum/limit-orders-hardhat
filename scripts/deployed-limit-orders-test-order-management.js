require('dotenv').config();
const { ethers } = require("hardhat");
const FormatTypes = ethers.utils.FormatTypes;
const util = require('util');
const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(process.env.PROVIDER);

const limitOrdersJSON_data = fs.readFileSync('./artifacts/contracts/limit-order/LimitOrders.sol/LimitOrders.json');
const LIMIT_ORDERS_ABI = JSON.parse(limitOrdersJSON_data).abi;

const BUSD_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // STABLE TOKEN
const USDC_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";  // PAYMENT TOKEN
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDCWBNB_ADDRESS = "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b";
const BUSDUSDC_ADDRESS = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"; // token0: BUSD, token1: USDC
const SELECTOR = 100;
const SAFE_DEADLINE = Math.round((new Date()).getTime() / 1000) + 590000;
const BNB_TO_SWAP_FOR_PAYMENT_TOKEN = '100000000000000000';
const BNB_AMOUNT = '1000000000000000';
const BNB_AMOUNT_0 = '2000000000000000';
const BNB_AMOUNT_1 = '3000000000000000';
const USDC_AMOUNT = '1000000'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const SAFE_GAS_FEES = '7500000000000000'
const BUSD_USDC = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"

const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN;
const STABLE_TOKEN = process.env.STABLE_TOKEN;
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
const PAYMENT_TOKEN_ROUTER_ADDRESS = process.env.PAYMENT_TOKEN_ROUTER_ADDRESS;
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS;
const DEPLOYER = process.env.DEPLOYER;
const LIMIT_ORDERS_ADDRESS = process.env.LIMIT_ORDERS_ADDRESS;
const SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;

console.log(LIMIT_ORDERS_ADDRESS);

const deepConsoleLog = (message) => {
    console.log(util.inspect(message, false, null, true));
}

(async() => {

    //const LimitOrders = await ethers.getContractFactory("LimitOrders");
    //const LIMIT_ORDERS_ABI = LimitOrders.interface.format(FormatTypes.json);
    const limitOrders = new web3.eth.Contract(
        LIMIT_ORDERS_ABI,
        LIMIT_ORDERS_ADDRESS
    );

    // check if contract is set
    await new Promise((resolve, reject) => {
        console.log('\nContract is set:');
        console.log('===================================================\n');
        limitOrders.methods.contractSet().call()
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    const transactionCount = await web3.eth.getTransactionCount(DEPLOYER_ADDRESS);
    const nonce0 = transactionCount;
    const nonce1 = transactionCount + 1;

    // create one order
    await new Promise((resolve, reject) => {
        console.log('\nCreating order:');
        console.log('===================================================\n');

        const createOrderFunctionCall = limitOrders.methods.createOrder(
            100,
            USDCWBNB_ADDRESS,
            BNB_AMOUNT,
            0,
            SAFE_DEADLINE,
        );

        const txData = createOrderFunctionCall.encodeABI();

        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: LIMIT_ORDERS_ADDRESS,
            data: txData,
            value: BNB_AMOUNT,
            gas: 300000,
            nonce: nonce0
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
               console.log('Error signing transaction:');
               console.log(err);
                resolve();
            });
    });

    // create one order
    await new Promise((resolve, reject) => {
        console.log('\nCreating order:');
        console.log('===================================================\n');

        const createOrderFunctionCall = limitOrders.methods.createOrder(
            100,
            USDCWBNB_ADDRESS,
            BNB_AMOUNT,
            0,
            SAFE_DEADLINE,
        );

        const txData = createOrderFunctionCall.encodeABI();

        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: LIMIT_ORDERS_ADDRESS,
            data: txData,
            value: BNB_AMOUNT,
            gas: 300000,
            nonce: nonce1
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
                console.log('Error signing transaction:');
                console.log(err);
                resolve();
            });
    });

    // check order count
    await new Promise((resolve, reject) => {
        console.log('\nOrder count:');
        console.log('===================================================\n');

        limitOrders.methods.getOrderCount().call(
            {
                from: DEPLOYER_ADDRESS
            }
        )
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    // view order
    await new Promise((resolve, reject) => {
        console.log('\nView Order:');
        console.log('===================================================\n');

        limitOrders.methods.viewOrder(0).call(
            {
                from: DEPLOYER_ADDRESS
            }
        )
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

})()
    .catch((err) => {
        console.log(err);
    });