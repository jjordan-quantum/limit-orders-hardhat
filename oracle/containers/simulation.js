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
    Channel.subscribe("simulateOrderLiquidation", function(data) {
        Logger.log("SIMULATION: Received simulateOrderLiquidation topic");
        Logger.log(data);

        simulateOrderLiquidation(JSON.parse(JSON.stringify(data))).then();
    });

    const simulateOrderLiquidation = async (data) => {

        const liquidationTransaction = LimitOrders.getLiquidationTransaction(JSON.parse(JSON.stringify(data)));
        web3.eth.call(liquidationTransaction, 'latest')
            .then((result) => {
                // successful simulation
                const data = {
                    data: data,
                    result: result,
                    error: null
                }
                //_________________
                // publish request
                //=========================================================
                Channel.publish('orderLiquidationSimulated', JSON.parse(JSON.stringify(data)));
                //=========================================================
                //
                //
                //________________
            })
            .catch((error) => {
                // reverted
                // TODO - extract revert reason - maybe in controller?
                const data = {
                    data: data,
                    result: null,
                    error: error
                }
                //_________________
                // publish request
                //=========================================================
                Channel.publish('orderLiquidationSimulated', JSON.parse(JSON.stringify(data)));
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