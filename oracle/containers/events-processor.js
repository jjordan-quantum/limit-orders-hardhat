exports.EventProcessor = (function() {

    const { Channel } = require("./channel");
    const { Logger } = require("./logger");
    const { Config } = require('./config');
    const Web3 = require('web3');
    const orderSignatures = Config.getLimitOrderTopics();
    const EXPECTED_LENGTH_OF_TOPICS = 4;

    Channel.subscribe('newLimitOrderEvent', async function(data) {
        Logger.log("EVENT PROCESSOR: Received newLimitOrderEvent topic");
        Logger.log(data);

        if(data) {
            const event = data;
            const topics = event.topics;

            if(topics) {
                if(Array.isArray(topics)) {
                    if(topics.length === EXPECTED_LENGTH_OF_TOPICS) {

                        const signature = topics[0];
                        const rawUserAddress = topics[1];
                        const rawOrderNum = topics[2];
                        const rawDeadline = topics[3];


                        const user = Web3.utils.toChecksumAddress(rawUserAddress.substring(rawUserAddress.length-40, rawUserAddress.length));
                        const orderNum = Web3.utils.hexToNumber(rawOrderNum);
                        const deadline = Web3.utils.hexToNumber(rawDeadline);

                        console.log("USER: " + user);
                        console.log("ORDERNUM: " + orderNum);
                        console.log("DEADLINE: " + deadline);

                        if(signature === orderSignatures.createOrder) {
                            console.log("CREATE ORDER EVENT WITH SIGNATURE: " + signature);
                            createOrder(
                                user,
                                orderNum,
                                deadline
                            );
                        } else if(signature === orderSignatures.updateOrder) {
                            console.log("UPDATE ORDER EVENT WITH SIGNATURE: " + signature);
                            updateOrder(
                                user,
                                orderNum,
                                deadline
                            );
                        } else if(signature === orderSignatures.deleteOrder) {
                            console.log("DELETE ORDER EVENT WITH SIGNATURE: " + signature);
                            deleteOrder(
                                user,
                                orderNum,
                                deadline
                            );
                        } else {
                            console.log("UNKNOWN EVENT SIGNATURE: " + signature);
                        }
                    } else {
                        console.log("unexpected length for topics");
                    }
                } else {
                    console.log("topics not an array");
                }
            } else {
                console.log("no topics found");
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