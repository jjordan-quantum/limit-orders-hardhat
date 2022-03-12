// loaded in main app
exports.Simulation = (function() {

    // for simulating transactions using eth_call
    const { Channel } = require("./channel");
    const { Logger } = require("./logger");
    const { Config } = require('./config');
    const { LimitOrders } = require('./limit-orders');
    const Web3 = require('web3');
    const HTTPProvider = Config.getHTTPSProvider();
    let web3 = new Web3(HTTPProvider);
    const LIMIT_ORDERS_ABI = Config.getLimitOrdersABI();
    const limitOrdersContractAddress = Config.getLimitOrderContractAddress();

    const connectHTTPWeb3Internal = () => {
        web3 = new Web3(HTTPProvider);
    }

    const disconnectHTTPWeb3Internal = () => {
        web3 = null;
    }

    const publishedTopics = [
        'orderLiquidationSimulated'
    ];

    const subscribedTopics = [
        'simulateOrderLiquidation'
    ];

    // =================================================================================================================
    //
    //  Subscription for new tasks -> simulate order liquidation
    //
    // =================================================================================================================

    // create subscription
    Channel.subscribe("simulateOrderLiquidation", async function(data) {
        Logger.log("SIMULATION: Received simulateOrderLiquidation message:");
        Logger.inspect(data);
        const user = data.user;
        const orderNum = data.orderNum;

        simulateOrderLiquidation(
            user,
            orderNum
        ).then();
    });

    const simulateOrderLiquidation = async (
        user,
        orderNum
    ) => {

        const liquidationTransaction = LimitOrders.getLiquidationTransaction(
            user,
            orderNum
        );
        web3.eth.call(liquidationTransaction, 'latest')
            .then((result) => {
                // successful simulation
                //_________________
                // publish request
                //=========================================================
                Channel.publish('orderLiquidationSimulated', {
                    user: user,
                    orderNum: orderNum,
                    result: result,
                    error: null
                });
                //=========================================================
                //
                //
                //________________
            })
            .catch((error) => {
                //_________________
                // publish request
                //=========================================================
                Channel.publish('orderLiquidationSimulated', {
                    user: user,
                    orderNum: orderNum,
                    result: null,
                    error: error.toString()
                });
                //=========================================================
                //
                //
                //________________

            })
    }

    const runTestInternal = async () => {

        const transactionObject = {
            data: '0x',
            to: '0x0000000000000000000000000000000000000000',
            gas: 200000,
            value: '1000000000000000000'
        }
        console.log("Simulating transaction: ");
        console.log(transactionObject);
        web3.eth.call(transactionObject, 'latest')
            .then((result) => {
                console.log("Transaction simulation successful!")
                console.log(result)
            })
            .catch((error) => {
                console.log("Error simulating transaction:");
                console.log(error);
            })
    }

    return { runTest: runTestInternal }
})();