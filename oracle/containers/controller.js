// loaded in main app
exports.Controller = (function() {

    const { Channel } = require('./channel');
    const { Logger } = require('./logger');
    const { Queries } = require('./queries');

    const util = require("util");
    let busyWorking = false;
    let startedWorking;
    let nextTaskCollectionID = 0;
    const taskCollections = {};
    let ordersByUser = {};

    /*
    (async () => {
        const allActiveOrders = await Queries.getAllActiveOrders();
        getOrdersByUser(allActiveOrders.slice());
    })();

     */

    // keep orders in memory
    // update orders in memory and in db on each request from chainlink node (EA)
    // update orders in memory and in db on each order sent to chainlink node (EI)
    // update orders in memory and in db on each order with specific failing conditions for eth_call

    const publishedTopics = [
        'newTask',
        'newTaskCollection',
        'simulateOrderLiquidation'
    ]

    const subscribedTopics = [

        // updater scheduled task
        'performScheduledJob',

        // for debugging
        'setDebugMode', // ???

        // for task completion, published by worker-queue
        'taskComplete',   // will have result from check for liquidation
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

        const timestamp = Math.round((new Date()).getTime() / 1000);
        Object.keys(ordersByUser).forEach((user) => {
            const orders = ordersByUser[user];
            orders.forEach((order) => {
                if(order.status === 1) {
                    if(order.deadline > timestamp) {
                        //_________________
                        // publish new task - to check if order can be liquidated
                        //=========================================================
                        Channel.publish('newTask', JSON.parse(JSON.stringify(order)));
                        //=========================================================
                        //
                        //
                        //________________
                    } else {
                        // set order to expired
                        // TODO......
                    }
                }
            })
        })
    }

    // =================================================================================================================
    //
    //  Updating orders in memory and db in response to requests from chainlink node
    //
    // =================================================================================================================

    // create subscription for create request
    Channel.subscribe("createOrder", function(data) {
        Logger.log("CONTROLLER: Received createOrder topic");
        Logger.log(data);

        createOrder(JSON.parse(JSON.stringify(data))).then();
    });

    // create subscription for update request
    Channel.subscribe("updateOrder", function(data) {
        Logger.log("CONTROLLER: Received updateOrder topic");
        Logger.log(data);

        updateOrder(JSON.parse(JSON.stringify(data))).then();
    });

    // create subscription for delete request
    Channel.subscribe("deleteOrder", function(data) {
        Logger.log("CONTROLLER: Received deleteOrder topic");
        Logger.log(data);

        deleteOrder(JSON.parse(JSON.stringify(data))).then();
    });

    const orderTemplate = {
        user: "0x0000000000000000000000000000000000000000",     // user's account address
        orderNum: 0,    // will be the order number for the order -> verify this is the next order number in the db
        selector: 101,   // represents the function # and swap direction
        pair: "0x0000000000000000000000000000000000000000",  // pair address
        inputAmount: 1000,  // input amount for swap
        minOutputAmount: 0, // 'amountOutMin' value for swap
        deadline: 1313213213,    // UNIX timestamp expiry,
        jobID: 0
    }

    const createOrder = async (data) => {

        // TODO - add jobID

        const user = data.user;
        const orderNum = parseInt(data.orderNum);
        const selector = parseInt(data.selector);
        const pair = data.pair;
        const inputAmount = data.inputAmount;
        const minOutputAmount = data.minOutputAmount;
        const deadline = parseInt(data.deadline);

        // get all orders for user in memory
        // confirm that orderNum is highest orderNum + 1
        // if not -> check all orders on blockchain
        // add order to memory

        // write to db
        await Queries.writeNewOrder(
            user,
            orderNum,
            selector,
            pair,
            inputAmount,
            minOutputAmount,
            deadline
        );
    }

    const updateOrder = async (data) => {

        const mode = data.mode;
        if(mode === 'amounts') {
            const user = data.user;
            const orderNum = parseInt(data.orderNum);
            const newInputAmount = data.inputAmount;
            const newMinOutputAmount = data.minOutputAmount;
            // update in DB
            await Queries.updateOrderAmounts(
                user,
                orderNum,
                newInputAmount,
                newMinOutputAmount
            );
            // update in memory
        } else if(mode === 'output') {
            const user = data.user;
            const orderNum = parseInt(data.orderNum);
            const newMinOutputAmount = data.minOutputAmount;
            // update in DB
            await Queries.updateOrderMinOutputAmount(
                user,
                orderNum,
                newMinOutputAmount
            );
            // update in memory
        } else if(mode === 'deadline') {
            const user = data.user;
            const orderNum = parseInt(data.orderNum);
            const deadline = parseInt(data.deadline);
            // update in DB
            await Queries.updateOrderDeadline(
                user,
                orderNum,
                deadline
            );
            // update in memory
        } else {
            // update all
            const user = data.user;
            const orderNum = parseInt(data.orderNum);
            const newInputAmount = data.inputAmount;
            const newMinOutputAmount = data.minOutputAmount;
            const deadline = parseInt(data.deadline);
            // update in DB
            await Queries.updateOrder(
                user,
                orderNum,
                newInputAmount,
                newMinOutputAmount,
                deadline
            );
            // update in memory
        }
    }

    const deleteOrder = async (data) => {

        const user = data.user;
        const orderNum = data.orderNum;
        // remove order from DB
        await Queries.updateOrderStatus(
            user,
            orderNum,
            0
        );
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

    // =================================================================================================================
    //
    //  Data manipulation for orders in memory
    //
    // =================================================================================================================

    const getOrdersByUser = (allActiveOrders) => {
        allActiveOrders.forEach((order) => {
            if(!ordersByUser.hasOwnProperty(order.user_address)) {
                ordersByUser[order.user_address] = [];
            }
            ordersByUser[order.user_address].push(order);
        });
    }

    return {}
})();