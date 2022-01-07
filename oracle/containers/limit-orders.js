// container for limit orders contract interactions
exports.LimitOrders = (function() {

    const {Channel} = require("./channel");
    const {Logger} = require("./logger");
    const { Config } = require('./config');
    const Web3 = require('web3');
    const HTTPProvider = Config.getHTTPSProvider();
    let web3 = new Web3(HTTPProvider);
    const LIMIT_ORDERS_ABI = Config.getLimitOrdersABI();
    const limitOrdersContractAddress = Config.getLimitOrderContractAddress();
    const LimitOrders = new web3.eth.Contract(LIMIT_ORDERS_ABI, limitOrdersContractAddress);

    // OPTION 1 - a single contract instance that all calls share...

    const connectHTTPWeb3Internal = () => {
        web3 = new Web3(HTTPProvider);
    }

    const disconnectHTTPWeb3Internal = () => {
        web3 = null;
    }

    const checkForLiquidation = async (data) => {
        const _LimitOrders_ = JSON.parse(JSON.stringify(LimitOrders));
        _LimitOrders_.methods.checkForLiquidation(data.user, data.orderNum).call()
            .then((result) => {
                const data = {
                    data: data,
                    result: result,
                    error: null
                }
                //_________________
                // publish request
                //=========================================================
                Channel.publish('taskComplete', JSON.parse(JSON.stringify(data)));
                //=========================================================
                //
                //
                //________________
            })
            .catch((error) => {
                const data = {
                    data: data,
                    result: null,
                    error: error
                }
                //_________________
                // publish request
                //=========================================================
                Channel.publish('taskComplete', JSON.parse(JSON.stringify(data)));
                //=========================================================
                //
                //
                //________________
            })
    }

    const publishedTopics = [
        'taskComplete',
        'orderReadyForLiquidation' // ??
    ]

    const subscribedTopics = [
        'newTask',
        'newTaskCollection' // ??
    ];

    // =================================================================================================================
    //
    //  Subscription for new tasks -> checking for liquidation
    //
    // =================================================================================================================

    // create subscription for create request
    Channel.subscribe("newTask", function(data) {
        Logger.log("LIMITORDERS: Received newTask topic");
        Logger.log(data);

        checkForLiquidation(JSON.parse(JSON.stringify(data))).then();
    });

    return {

    }
})();