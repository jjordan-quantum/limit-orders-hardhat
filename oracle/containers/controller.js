// loaded in main app
exports.Controller = (function() {

    const { Channel } = require('./channel');
    const { Logger } = require('./logger');
    const { Queries } = require('./queries');

    const util = require("util");
    let busyWorking = false;
    let ordersLoaded = false;
    let startedWorking;
    let nextTaskCollectionID = 0;
    const taskCollections = {};
    let ordersByUser = {};
    const OrderStatus = {
        deleted: 0,     // deleted via an oracle request
        checking: 1,    // actively checking for liquidation on each new block
        failed: 2,     // removed by oracle - failed / expired
        expired: 3,
        simulating: 4,  // liquidation tx sent to simulator
        liquidating: 5,  // liquidation tx sent to oracle
        sent: 6,
        hashReceived: 7,
        confirmed: 8,
        error: 9
    };

    /*
     *  reasons for removal:
     *  - expired
     *  - simulation failed with revert reason
     *  - liquidation failed with revert reason
     *  - liquidation tx encountered an error
     *
     *  note: it is possible that an order being simulated is returned to the checking state
     *
     */


    (async () => {
        Logger.log("Loading all orders from db....");
        const allActiveOrders = await Queries.getAllActiveOrders();
        getOrdersByUser(allActiveOrders.slice());
        ordersLoaded = true;
    })();



    // keep orders in memory
    // update orders in memory and in db on each request from chainlink node (EA)
    // update orders in memory and in db on each order sent to chainlink node (EI)
    // update orders in memory and in db on each order with specific failing conditions for eth_call

    // TODO - create order status updating queue


    // =================================================================================================================
    //
    //  Updating orders in memory and db in response to requests from chainlink node
    //
    // =================================================================================================================

    // create subscription for create request
    Channel.subscribe("createOrder", async function(data) {
        Logger.log("CONTROLLER: Received createOrder message:");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;
        const deadline = data.deadline;

        createOrder(
            user,
            orderNum,
            deadline
        ).then();
    });

    // create subscription for update request
    Channel.subscribe("updateOrder", async function(data) {
        Logger.log("CONTROLLER: Received updateOrder message:");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;
        const deadline = data.deadline;

        updateOrder(
            user,
            orderNum,
            deadline
        ).then();
    });

    // create subscription for delete request
    Channel.subscribe("deleteOrder", async function(data) {
        Logger.log("CONTROLLER: Received deleteOrder message:");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;

        deleteOrder(
            user,
            orderNum
        ).then();
    });

    const orderTemplate = {
        user: "0x0000000000000000000000000000000000000000",     // user's account address
        orderNum: 0,    // will be the order number for the order -> verify this is the next order number in the db
        deadline: 1313213213,    // UNIX timestamp expiry,
        jobID: 0 // ?
    }

    const createOrder = async (
        user,
        orderNum,
        deadline
    ) => {

        // TODO
        // get all orders for user in memory
        // confirm that orderNum is highest orderNum + 1
        // if not -> check all orders on blockchain

        Logger.log("CONTROLLER: Creating order " + orderNum + " for " + user + " with deadline " + deadline);
        // add order to memory
        addOrderForUser(
            user,
            orderNum,
            deadline
        );

        // write to db
        await Queries.writeNewOrder(
            user,
            orderNum,
            deadline
        );
    }

    const updateOrder = async (
        user,
        orderNum,
        deadline
    ) => {

        // check order in memory
        // TODO
        // check if deadline has changed - only update order if this is the case

        Logger.log("CONTROLLER: Updating order " + orderNum + " for " + user + " with deadline" + deadline);
        // update order in memory
        updateOrderForUser(
            user,
            orderNum,
            deadline
        );

        // update in DB
        // TODO - also update status if required
        await Queries.updateOrderDeadline(
            user,
            orderNum,
            deadline
        );
    }

    const deleteOrder = async (
        user,
        orderNum
    ) => {

        Logger.log("CONTROLLER: Deleting order " + orderNum + " for " + user);
        // remove order from DB
        await Queries.updateOrderStatus(
            user,
            orderNum,
            OrderStatus.deleted
        );

        // TODO
        // reconcile orders for user from blockchain
        // update status of orders in memory
        updateOrderStatusForUser(
            user,
            orderNum,
            OrderStatus.deleted
        );
    }

    const expireOrder = async (
        user,
        orderNum
    ) => {

        Logger.log("CONTROLLER: Expiring order " + orderNum + " for " + user);
        // remove order from DB
        await Queries.updateOrderStatus(
            user,
            orderNum,
            OrderStatus.removed
        );

        // update status of orders in memory
        updateOrderStatusForUser(
            user,
            orderNum,
            OrderStatus.removed
        );
        // TODO
        // reconcile orders for user ??
    }

    const updateOrderStatus = async (
        user,
        orderNum,
        newStatus
    ) => {
        Logger.log("CONTROLLER: Updating order " + orderNum + " status for user " + user + " to newStatus");
        await Queries.updateOrderStatus(
            user,
            orderNum,
            newStatus
        );

        // update status of orders in memory
        updateOrderStatusForUser(
            user,
            orderNum,
            newStatus
        );
    }

    // =================================================================================================================
    //
    //  Creation of tasks for checking for liquidations
    //
    // =================================================================================================================

    // create subscription
    Channel.subscribe("performScheduledJob", async function(data) {
        Logger.log("CONTROLLER: Received performScheduledJob message");
        if(ordersLoaded) {
            performScheduledJob().then();
        } else {
            console.log("CONTROLLER: Orders not loaded - cannot check for liquidations!");
        }
    });

    // check all orders for liquidation on schedule
    const performScheduledJob = async () => {

        const timestamp = Math.round((new Date()).getTime() / 1000);
        Object.keys(ordersByUser).forEach((user) => {
            Logger.log("CONTROLLER: Processing orders for user " + user);
            const orders = ordersByUser[user].slice();
            orders.forEach((order) => {
                if(order.status === 1) {
                    if(order.deadline > timestamp) {
                        //_________________
                        // publish new task - to check if order can be liquidated
                        //=========================================================
                        Channel.publish('checkForLiquidation', {
                            user: order.user,
                            orderNum: order.orderNum
                        });
                        //=========================================================
                        //
                        //
                        //________________
                    } else {
                        // set order to expired
                        expireOrder(
                            order.user,
                            order.orderNum
                        ).then();
                    }
                }
            })
        })
    }

    // =================================================================================================================
    //
    //  Subscriptions to checkForLiquidationComplete messages
    //
    // =================================================================================================================

    // create subscription for results from checking for liquidation
    Channel.subscribe("checkForLiquidationComplete", async function(data) {
        Logger.log("CONTROLLER: Received checkForLiquidationComplete message:");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;
        const result = data.result;
        const error = data.error;

        if(error) {
            Logger.log("CONTROLLER: Error while checking for liquidation for orderNum " + orderNum + " for " + user);
            Logger.log(error);
            // TODO
            // handle error - update order status for certain types of errors - check revert reason
            updateOrderStatus(
                user,
                orderNum,
                OrderStatus.error,
                error
            ).then();
        } else {
            if(result) {
                Logger.log("CONTROLLER: Check for liquidation successful for " + orderNum + " for " + user);
                //_________________
                // publish new task - to check if order can be liquidated
                //=========================================================
                Channel.publish('simulateOrderLiquidation', {
                    user: user,
                    orderNum: orderNum
                });
                //=========================================================
                //
                //
                //________________
                updateOrderStatus(
                    user,
                    orderNum,
                    OrderStatus.simulating
                ).then();
            }
        }

    });

    // =================================================================================================================
    //
    //  Updating orders in memory and db in response to result from simulating liquidation transaction
    //
    // =================================================================================================================

    // create subscription for results from order liquidation simulation
    Channel.subscribe("orderLiquidationSimulated", async function(data) {
        Logger.log("CONTROLLER: Received orderLiquidationSimulated topic");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;
        const result = data.result;
        const error = data.error;

        if(error) {
            Logger.log("CONTROLLER: Error while simulating order " + orderNum + " for " + user);
            Logger.log(error);
            // TODO
            // handle error - update status in db and memory if required
            updateOrderStatus(
                user,
                orderNum,
                OrderStatus.error,
                error
            ).then();
        } else {
            if(result) {
                // TODO - confirm result for successful liquidation
                Logger.log("CONTROLLER: Simulation successful for " + orderNum + " for " + user);
                //_________________
                // publish new task - to check if order can be liquidated
                //=========================================================
                Channel.publish('sendLiquidationRequest', {
                    user: user,
                    orderNum: orderNum
                });
                //=========================================================
                //
                //
                //________________
                // update order status
                updateOrderStatus(
                    user,
                    orderNum,
                    OrderStatus.liquidating
                ).then();
            }
        }
    });

    // =================================================================================================================
    //
    //  Updating orders in memory and db in response to requests sent to chainlink node
    //
    // =================================================================================================================

    // create subscription for updating order status when liquidation tx sent
    Channel.subscribe("liquidationTxSent", async function(data) {
        Logger.log("CONTROLLER: Received liquidationTxSent message");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;

        Queries.updateOrderStatus(
            user,
            orderNum,
            OrderStatus.sent
        ).then();

        // update status of orders in memory
        updateOrderStatusForUser(
            user,
            orderNum,
            OrderStatus.sent
        );
    });

    // create subscription for updating order status when tx hash received
    Channel.subscribe("liquidationTxHashReceived", async function(data) {
        Logger.log("CONTROLLER: Received liquidationTxHashReceived message");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;
        const hash = data.hash;

        Queries.updateOrderStatus(
            user,
            orderNum,
            OrderStatus.hashReceived
        ).then();

        // update status of orders in memory
        updateOrderStatusForUser(
            user,
            orderNum,
            OrderStatus.hashReceived,
            hash
        );

    });

    // create subscription for updating order status when tx hash received
    Channel.subscribe("liquidationTxReceiptReceived", async function(data) {
        Logger.log("CONTROLLER: Received liquidationTxReceiptReceived message");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;
        const hash = data.hash;
        const receipt = JSON.parse(JSON.stringify(data.receipt));
        const status = data.status;

        // update order in memory and db
        confirmLiquidation(
            user,
            orderNum,
            receipt,
            status,
            null
        );
    });

    // create subscription for updating order status when tx hash received
    Channel.subscribe("errorSendingLiquidationTx", async function(data) {
        Logger.log("CONTROLLER: Received errorSendingLiquidationTx message");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;
        const error = data.error;

        // update order in memory and db
        confirmLiquidation(
            user,
            orderNum,
            null,
            false,
            error
        );
    });

    // create subscription for updating order status when tx hash received
    Channel.subscribe("errorSigningLiquidationTx", async function(data) {
        Logger.log("CONTROLLER: Received errorSigningLiquidationTx message");
        Logger.log(data);
        const user = data.user;
        const orderNum = data.orderNum;
        const error = data.error;

        // update order in memory and db
        confirmLiquidation(
            user,
            orderNum,
            null,
            false,
            error
        );
    });

    const confirmLiquidation = (
        user,
        orderNum,
        receipt,
        status,
        error
    ) => {
        // TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // add verbosity
        if(error) {
            updateOrderStatus(
                user,
                orderNum,
                OrderStatus.error,
                error
            ).then();
        } else {
            if(receipt) {
                updateOrderStatus(
                    user,
                    orderNum,
                    OrderStatus.confirmed,
                ).then();
            }
        }
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

    const addOrderForUser = (
        user,
        orderNum,
        deadline
    ) => {
        if(!ordersByUser.hasOwnProperty(user)) {
            Logger.log("CONTROLLER: User " + user + " not found!  Creating user!");
            ordersByUser[user] = [];
        }
        ordersByUser[user].push({
            user: user,
            orderNum: orderNum,
            deadline: deadline,
            status: 1
        });
    }

    const updateOrderForUser = (
        user,
        orderNum,
        deadline
    ) => {
        if(!ordersByUser.hasOwnProperty(user)) {
            Logger.log("CONTROLLER: User " + user + " not found!  Creating user!");
            ordersByUser[user] = [];
        }
        const orders = ordersByUser[user];
        let order;
        for(let i = 0; i < orders.length; i++) {
            const _order = orders[i];
            if(_order.orderNum === orderNum) {
                order = _order;
            }
        }
        if(!order) {
            Logger.log("CONTROLLER: Order " + orderNum + " not found for user " + user + "!  Cannot update!");
        } else {
            order.deadline = deadline;
        }
    }

    const updateOrderStatusForUser = (
        user,
        orderNum,
        newStatus,
        hash,
        txStatus
    ) => {
        if(!ordersByUser.hasOwnProperty(user)) {
            Logger.log("CONTROLLER: User " + user + " not found!  Creating user!");
            ordersByUser[user] = [];
        }
        const orders = ordersByUser[user];
        let order;
        for(let i = 0; i < orders.length; i++) {
            const _order = orders[i];
            if(_order.orderNum === orderNum) {
                order = _order;
            }
        }
        if(!order) {
            Logger.log("CONTROLLER: Order " + orderNum + " not found for user " + user + "!  Cannot update status!");
        } else {
            order.status = newStatus;
            if(hash) {
                order.hash = hash;
            }
            if(txStatus) {
                order.txStatus = txStatus;
            }
        }
    }

    return {}
})();