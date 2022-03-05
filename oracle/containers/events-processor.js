exports.EventProcessor = (function() {

    const { Channel } = require("./channel");
    const { Logger } = require("./logger");
    const { Config } = require('./config');
    const Web3 = require('web3');
    const orderSignatures = Config.getLimitOrderTopics();
    const MINIMUM_LENGTH_OF_TOPICS = 3;

    Channel.subscribe('newLimitOrderEvent', async function(data) {
        Logger.log("EVENT PROCESSOR: Received newLimitOrderEvent message:");
        Logger.log(data);

        if(data) {
            const event = data;
            const topics = event.topics;

            if(topics) {
                if(Array.isArray(topics)) {
                    if(topics.length >= MINIMUM_LENGTH_OF_TOPICS) {

                        const signature = topics[0];
                        const rawUserAddress = topics[1];
                        const rawOrderNum = topics[2];
                        let deadline;

                        const user = Web3.utils.toChecksumAddress(rawUserAddress.substring(rawUserAddress.length-40, rawUserAddress.length));
                        const orderNum = Web3.utils.hexToNumber(rawOrderNum);

                        Logger.log("EVENT PROCESSOR: user: " + user);
                        Logger.log("EVENT PROCESSOR: orderNum: " + orderNum);

                        if(topics.length > 3) {
                            const rawDeadline = topics[3];
                            deadline = Web3.utils.hexToNumber(rawDeadline);
                            Logger.log("EVENT PROCESSOR: deadline: " + deadline);
                        }

                        if(signature === orderSignatures.createOrder) {
                            Logger.log("EVENT PROCESSOR: CreateOrder event with signature: " + signature);
                            createOrder(
                                user,
                                orderNum,
                                deadline
                            );
                        } else if(signature === orderSignatures.updateOrder) {
                            Logger.log("EVENT PROCESSOR: UpdateOrder event with signature: " + signature);
                            updateOrder(
                                user,
                                orderNum,
                                deadline
                            );
                        } else if(signature === orderSignatures.deleteOrder) {
                            Logger.log("EVENT PROCESSOR: DeleteOrder event with signature: " + signature);
                            deleteOrder(
                                user,
                                orderNum
                            );
                        } else {
                            Logger.log("EVENT PROCESSOR: unknown event signature: " + signature);
                        }
                    } else {
                        Logger.log("EVENT PROCESSOR: unexpected length for topics");
                    }
                } else {
                    Logger.log("EVENT PROCESSOR: topics not an array");
                }
            } else {
                Logger.log("EVENT PROCESSOR: no topics found");
            }

        }

    });

    const createOrder = (
        user,
        orderNum,
        deadline
    ) => {
        //_________________
        // publish request
        //=========================================================
        Channel.publish('createOrder', {
            user: user,
            orderNum: orderNum,
            deadline: deadline
        });
        //=========================================================
        //
        //
        //________________
    }

    const updateOrder = (
        user,
        orderNum,
        deadline
    ) => {
        //_________________
        // publish request
        //=========================================================
        Channel.publish('updateOrder', {
            user: user,
            orderNum: orderNum,
            deadline: deadline
        });
        //=========================================================
        //
        //
        //________________
    }

    const deleteOrder = (
        user,
        orderNum,
        deadline
    ) => {
        //_________________
        // publish request
        //=========================================================
        Channel.publish('deleteOrder', {
            user: user,
            orderNum: orderNum,
            deadline: deadline
        });
        //=========================================================
        //
        //
        //________________
    }

    return {}
})();