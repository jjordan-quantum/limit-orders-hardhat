// container for limit orders contract interactions
// loaded by order simulation container
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
        'checkForLiquidationComplete',  // will have result of check for liquidation for order
    ]

    const subscribedTopics = [
        'checkForLiquidation',
    ];

    // =================================================================================================================
    //
    //  Subscription for new tasks -> checking for liquidation
    //
    // =================================================================================================================

    // create subscription
    Channel.subscribe("checkForLiquidation", async function(data) {
        Logger.log("LIMITORDERS: Received checkForLiquidation message:");
        Logger.inspect(data);
        const user = data.user;
        const orderNum = data.orderNum;

        checkForLiquidation(
            user,
            orderNum
        ).then();
    });

    const checkForLiquidation = async (
        user,
        orderNum
    ) => {
        const _LimitOrders_ = new web3.eth.Contract(LIMIT_ORDERS_ABI, limitOrdersContractAddress);
        _LimitOrders_.methods.checkForLiquidation(user, orderNum).call()
            .then((result) => {
                //_________________
                // publish request
                //=========================================================
                Channel.publish('checkForLiquidationComplete', {
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
                Channel.publish('checkForLiquidationComplete', {
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

    const latest = async () => {
        return await web3.eth.getBlockNumber();
    }

    const getRouterAddressFromLimitOrders = async () => {
        const _LimitOrders_ = new web3.eth.Contract(LIMIT_ORDERS_ABI, limitOrdersContractAddress);
        return await _LimitOrders_.methods.routerAddress().call();
    }

    const getLiquidationTransactionInternal = (
        user,
        orderNum
    ) => {

        const _LimitOrders_ = new web3.eth.Contract(LIMIT_ORDERS_ABI, limitOrdersContractAddress);
        const txData = _LimitOrders_.methods.liquidate(user, orderNum).encodeABI();

        return {
            data: txData,
            to: limitOrdersContractAddress,
            from: approvedOracleAddress,
            gas: 200000
        }
    }

    const getLiquidationTransactionDataInternal = (user, orderNum) => {
        const _LimitOrders_ = new web3.eth.Contract(LIMIT_ORDERS_ABI, limitOrdersContractAddress);
        const txData = _LimitOrders_.methods.liquidate(user, orderNum).encodeABI();
        console.log("Tx data for liquidate:");
        console.log(txData);
        return txData;
    }

    const runTestInternal = async () => {

        console.log("Block number " + await latest());
        console.log("Router address " + await getRouterAddressFromLimitOrders());
    }

    return {
        runTest: runTestInternal ,
        getLiquidationTransaction: getLiquidationTransactionInternal,
        getLiquidationTransactionData: getLiquidationTransactionDataInternal
    }
})();