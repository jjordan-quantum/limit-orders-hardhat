const fs = require('fs');
require('dotenv').config();
const Web3 = require('web3');
const web3 = new Web3(process.env.PROVIDER);

const pathToABI = './artifacts/contracts/limit-order/LimitOrders.sol/LimitOrders.json';
const limitOrdersJSON_data = fs.readFileSync(pathToABI);
const LIMIT_ORDERS_ABI = JSON.parse(limitOrdersJSON_data).abi;

const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN;
const STABLE_TOKEN = process.env.STABLE_TOKEN;
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
const PAYMENT_TOKEN_ROUTER_ADDRESS = process.env.PAYMENT_TOKEN_ROUTER_ADDRESS;
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS;
const DEPLOYER = process.env.DEPLOYER;
const LIMIT_ORDERS_ADDRESS = process.env.LIMIT_ORDERS_ADDRESS;
const SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;

// get state vars - router address
async function getRouterAddress() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.routerAddress().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting routerAddress:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - router set
async function getRouterSet() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.routerSet().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting routerSet:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - payments router address
async function getPaymentsRouterAddress() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.paymentsRouterAddress().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting paymentsRouterAddress:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - payment router address set
async function getPaymentsRouterSet() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.paymentsRouterSet().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting paymentsRouterSet:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - weth address
async function getWethAddress() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.wethAddress().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting wethAddress:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - swap router address
async function getSwapRouterAddress() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.swapRouterAddress().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting swapRouterAddress:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - payment token address
async function getPaymentToken() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.paymentToken().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting paymentToken:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - payment token set
async function getPaymentTokenSet() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.paymentTokenSet().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting paymentTokenSet:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - stable token address
async function getStableToken() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.stableToken().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting stableToken:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - stable token set
async function getStableTokenSet() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.stableTokenSet().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting stableTokenSet:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - contract set
async function getContractSet() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.contractSet().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting contractSet:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - refunds enabled
async function getRefundsEnabled() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.refundsEnabled().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting refundsEnabled:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - protocol fee enabled
async function getProtocolFeeEnabled() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.protocolFeeEnabled().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting protocolFeeEnabled:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - protocol fee amount
async function getProtocolFeeAmount() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.protocolFeeAmount().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting protocolFeeAmount:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - max deadline
async function getMaxDeadline() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.MAX_DEADLINE().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting MAX_DEADLINE:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// get state vars - avg gas consumed per liquidation
async function getAverageGasConsumedPerLiquidation() {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.averageGasConsumedPerLiquidation().call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting averageGasConsumedPerLiquidation:');
                console.log(err);
                resolve(undefined);
            });
    });
}

// create order - for example usage of web3....
async function createOrder(
    selector,
    pairAddress,
    inputAmount,
    minOutputAmount,
    deadline,
    senderAddress,
    privateKey,
    nonce
) {
    const txData = getCreateOrderTransactionData(
        selector,
        pairAddress,
        inputAmount,
        minOutputAmount,
        deadline
    );
    const transactionObject = {
        from: senderAddress,
        to: LIMIT_ORDERS_ADDRESS,
        data: txData,
        gas: 300000,
    }

    if(typeof(nonce) !== undefined) {
        transactionObject.nonce = nonce;
    }

    // TODO - check selector values to determine if value is required
    if(false) {
        transactionObject.value = inputAmount;
    }

    const result = {
        transaction: transactionObject,
        signed: false,
        sent: false,
        hashReceived: false,
        receiptReceived: false,
        signedTx: null,
        hash: null,
        receipt: null,
        status: null,
        signError: null,
        sendError: null,
        signErrorMessage: null,
        sendErrorMessage: null
    };

    await new Promise((resolve, reject) => {
        web3.eth.accounts.signTransaction(transactionObject, privateKey)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                result.signed = true;
                result.signedTx = signedTx.rawTransaction;
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                        result.sent = true;
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                        result.hashReceived = true;
                        result.hash = hash;
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        console.log(receipt);
                        result.receiptReceived = true;
                        result.receipt = receipt;
                        result.status = receipt.status;
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        result.sendError = true;
                        result.sendErrorMessage = err.toString();
                        resolve();
                    })
            })
            .catch((err) => {
                console.log('Error signing transaction:');
                console.log(err);
                result.signError = true;
                result.signErrorMessage = err.toString();
                resolve();
            });
    });

    return result;
}

// get create order transaction data
function getCreateOrderTransactionData(
    selector,
    pairAddress,
    inputAmount,
    minOutputAmount,
    deadline
) {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    const createOrderFunctionCall = limitOrders.methods.createOrder(
        selector,
        pairAddress,
        inputAmount,
        minOutputAmount,
        deadline,
    );
    return createOrderFunctionCall.encodeABI();
}

// view order
async function viewOrder(userAddress, orderNum) {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.viewOrder(orderNum).call({
            from: userAddress
        })
            .then((result) => {
                console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error viewing order ' + orderNum + ' for user ' + userAddress);
                console.log(err);
                resolve(undefined);
            });
    });
}

// get order count
async function getOrderCount(userAddress) {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.getOrderCount().call({
            from: userAddress
        })
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error getting order count for user ' + userAddress);
                console.log(err);
                resolve(undefined);
            });
    });
}

// update order
// update order amounts
// update order min output amount
// update order deadline
// delete order
// check payment token balance
// is input token weth
// get input token
// get token path
// get payment amount
// get payment token amount
// get protocol fee payment amount

// check for liquidation
async function checkForLiquidation(userAddress, orderNum) {
    const limitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, LIMIT_ORDERS_ADDRESS);
    return await new Promise((resolve, reject) => {
        limitOrders.methods.checkForLiquidation(userAddress, orderNum).call()
            .then((result) => {
                //console.log(result);
                resolve(result);
            })
            .catch((err) => {
                console.log('Error checking for liquidation for order ' + orderNum + ' for user ' + userAddress);
                console.log(err);
                resolve(undefined);
            });
    });
}