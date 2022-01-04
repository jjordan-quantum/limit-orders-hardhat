const {Channel} = require("./channel");
const {Logger} = require("./logger");
exports.Controller = (function() {

    const { Channel } = require('./channel');
    const { Logger } = require('./logger');
    const { Queries } = require('./queries');

    const util = require("util");
    let busyWorking = false;
    let startedWorking;
    let nextTaskCollectionID = 0;
    const taskCollections = {};
    let allActiveOrders;

    (async () => {
        allActiveOrders = await Queries.getAllActiveOrders();
    })();

    // keep orders in memory
    // update orders in memory and in db on each request from chainlink node (EA)
    // update orders in memory and in db on each order sent to chainlink node (EI)
    // update orders in memory and in db on each order with specific failing conditions for eth_call

    const publishedTopics = [
        'newTask',
        'newTaskCollection'
    ]

    const subscribedTopics = [

        // updater scheduled task
        'performScheduledJob',

        // for debugging
        'setDebugMode', // ???

        // for task completion, published by worker-queue
        'taskComplete',
        'taskCollectionComplete',

        // for requests from chainlink node -> order mgmt
        'createOrder',
        'updateOrder',
        'deleteOrder',

        // for order simulation results
        'orderLiquidationSimulated',

        // for requests sent to chainlink node -> liquidations
        'liquidationSent',
        'responseFromChainlinkNode',

        // for results of transactions sent to LimitOrders contract
        'orderLiquidationReceipt',

    ];

    // =================================================================================================================
    //
    //  Creation of tasks for checking for liquidations
    //
    // =================================================================================================================

    // create subscription
    Channel.subscribe("performScheduledJob", function(data) {
        Logger.log("CONTROLLER: Received performScheduledJob topic");
        performScheduledJob().then();
    });

    // check all orders for liquidation on schedule
    const performScheduledJob = async () => {

        // check all open orders for liquidation
        if(allActiveOrders) {
            const timestamp = Math.round((new Date()).getTime() / 1000);
            for(let i = 0; i < allActiveOrders.length; i++) {

                // check if order expired or not
                if(allActiveOrders[i].deadline > timestamp) {
                    //_________________
                    // publish new task - to check if order can be liquidated
                    //=========================================================
                    Channel.publish('newTask', JSON.parse(JSON.stringify(allActiveOrders[i])));
                    //=========================================================
                    //
                    //
                    //________________
                }
            }
        }
    }

    // =================================================================================================================
    //
    //  Updating orders in memory and db in response to requests from chainlink node
    //
    // =================================================================================================================

    // create subscription for create request
    Channel.subscribe("createOrder", function(data) {
        Logger.log("CONTROLLER: Received createOrder topic");
        createOrder(JSON.parse(JSON.stringify(data))).then();
    });

    // create subscription for update request
    Channel.subscribe("updateOrder", function(data) {
        Logger.log("CONTROLLER: Received updateOrder topic");
        updateOrder(JSON.parse(JSON.stringify(data))).then();
    });

    // create subscription for delete request
    Channel.subscribe("deleteOrder", function(data) {
        Logger.log("CONTROLLER: Received deleteOrder topic");
        deleteOrder(JSON.parse(JSON.stringify(data))).then();
    });

    const createOrder = async (data) => {

        // write to db
        // add to orders in memory
        // reconcile orders for user
    }

    const updateOrder = async (data) => {

        // update order in db
        // update order in memory
        // reconcile orders for user
    }

    const deleteOrder = async (data) => {

        // remove order from memory + update order number sequencing for user
        // update status + number sequencing of orders in db
        // reconcile orders for user
    }

    // =================================================================================================================
    //
    //  Updating orders in memory and db in response to result from simulating liquidation transaction
    //
    // =================================================================================================================

    // create subscription for results from order liquidation simulation
    Channel.subscribe("orderLiquidationSimulated", function(data) {
        Logger.log("CONTROLLER: Received orderLiquidationSimulated topic");
        orderLiquidationSimulated(JSON.parse(JSON.stringify(data))).then();
    });

    const orderLiquidationSimulated = async (data) => {

        // update order in memory with simulation result, if required
        // update order in db with simulation result, if required
    }

    // =================================================================================================================
    //
    //  Updating orders in memory and db in response to requests sent to chainlink node
    //
    // =================================================================================================================

    // create subscription for updating order status when liquidation request sent to oracle
    Channel.subscribe("liquidationSent", function(data) {
        Logger.log("CONTROLLER: Received liquidationSent topic");
        liquidationSent(JSON.parse(JSON.stringify(data))).then();
    });

    // create subscription for updating order status when response received from chainlink node
    Channel.subscribe("responseFromChainlinkNode", function(data) {
        Logger.log("CONTROLLER: Received responseFromChainlinkNode topic");
        responseFromChainlinkNode(JSON.parse(JSON.stringify(data))).then();
    });

    const liquidationSent = async (data) => {

        // update order in memory
        // update order in db
    }

    const responseFromChainlinkNode = async (data) => {

        // update order in memory
        // update order in db
    }

    // =================================================================================================================
    //
    //  Updating orders in memory and db in response to transaction receipt from order liquidation
    //
    // =================================================================================================================

    // create subscription for results from order liquidation transaction receipt
    Channel.subscribe("orderLiquidationReceipt", function(data) {
        Logger.log("CONTROLLER: Received orderLiquidationReceipt topic");
        orderLiquidationReceipt(JSON.parse(JSON.stringify(data))).then();
    });

    const orderLiquidationReceipt = async (data) => {

        // update order in memory with result, if required
        // update order in db with result, if required
    }

    return {}
})();