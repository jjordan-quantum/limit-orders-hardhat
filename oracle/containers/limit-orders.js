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
    const approvedOracleAddress = Config.getApprovedOracleAddress();

    const connectHTTPWeb3Internal = () => {
        web3 = new Web3(HTTPProvider);
    }

    const disconnectHTTPWeb3Internal = () => {
        web3 = null;
    }

    const publishedTopics = [
        'taskComplete',  // will have result of check for liquidation for order
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

    // create subscription
    Channel.subscribe("newTask", function(data) {
        Logger.log("LIMITORDERS: Received newTask topic");
        Logger.log(data);

        checkForLiquidation(JSON.parse(JSON.stringify(data))).then();
    });

    const checkForLiquidation = async (data) => {
        const _LimitOrders_ = new web3.eth.Contract(LIMIT_ORDERS_ABI, limitOrdersContractAddress);
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

    const latest = async () => {
        return await web3.eth.getBlockNumber();
    }

    const getRouterAddressFromLimitOrders = async () => {
        const _LimitOrders_ = new web3.eth.Contract(LIMIT_ORDERS_ABI, limitOrdersContractAddress);
        return await _LimitOrders_.methods.routerAddress().call();
    }

    const getLiquidationTransactionInternal = (data) => {

        const _LimitOrders_ = new web3.eth.Contract(LIMIT_ORDERS_ABI, limitOrdersContractAddress);
        const user = data.user;
        const orderNum = data.orderNum;
        const txData = _LimitOrders_.methods.liquidate(user, orderNum).encodeABI();

        return {
            data: txData,
            to: limitOrdersContractAddress,
            from: approvedOracleAddress,
            gas: 200000
        }
    }

    const runTestInternal = async () => {

        console.log("Block number " + await latest());
        console.log("Router address " + await getRouterAddressFromLimitOrders());
    }

    return {
        runTest: runTestInternal ,
        getLiquidationTransaction: getLiquidationTransactionInternal
    }
})();