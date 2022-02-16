const Web3 = require("web3");
const {Config} = require("./config");
exports.Web3Requests = (function() {
    const { Channel } = require('./channel');
    const { Config } = require('./config');
    const Web3 = require('web3');
    const HTTPProvider = Config.getHTTPSProvider();
    const WebsocketProvider = Config.getWebsocketProvider();
    let web3 = new Web3(HTTPProvider);
    const limitOrdersContractAddress = Config.getLimitOrderContractAddress();

    const options = {

        // Useful if requests result are large
        clientConfig: {
            maxReceivedFrameSize: 10000000,   // bytes - default: 1MiB
            maxReceivedMessageSize: 10000000, // bytes - default: 8MiB
        },

        // Enable auto reconnection
        reconnect: {
            auto: true,
            delay: 100, // ms
            maxAttempts: 5,
            onTimeout: false
        }
    };

    let WSWeb3;
    if(WebsocketProvider) {
        WSWeb3 = new Web3(new Web3.providers.WebsocketProvider(WebsocketProvider, options));
    }

    const connectWebsocketInternal = () => {
        if(WebsocketProvider) {
            WSWeb3 = new Web3(new Web3.providers.WebsocketProvider(WebsocketProvider, options));
        }
    }

    const disconnectWebsocketInternal = () => {
        WSWeb3 = null;
    }

    const connectHTTPWeb3Internal = () => {
        web3 = new Web3(HTTPProvider);
    }

    const disconnectHTTPWeb3Internal = () => {
        web3 = null;
    }

    Channel.subscribe('usingWebsocket', function(data) {
        connectWebsocketInternal();
    });

    const getBlockInternal = async (number, full) => {
        return new Promise((resolve, reject) => {
            web3.eth.getBlock(number, full)
                .then((block) => {
                    resolve(block);
                })
                .catch((err) => {
                    console.log("Error getting block " + number);
                    console.log(err);
                    resolve(null);
                });
        })
    }

    const getLogsInternal = async (number) => {
        const filterArgs = {
            fromBlock: number,
            toBlock: number
        }
        return new Promise((resolve, reject) => {
            WSWeb3.eth.getPastLogs(filterArgs)
                .then((logs) => {
                    resolve(logs);
                })
                .catch((err) => {
                    console.log("Error getting logs for block " + number);
                    console.log(err);
                    resolve(null);
                });
        })
    }

    const getTransactionInternal = async (txHash) => {
        return new Promise((resolve, reject) => {
            web3.eth.getTransaction(txHash)
                .then((tx) => {
                    console.log("tx: " + tx)
                    resolve(tx);
                })
                .catch((err) => {
                    console.log("Error getting transaction " + txHash)
                    console.log(err)
                    resolve(null);
                });
        })
    }

    const getTransactionReceiptInternal = async (txHash) => {
        return new Promise((resolve, reject) => {
            web3.eth.getTransactionReceipt(txHash)
                .then((receipt) => {
                    resolve(receipt);
                })
                .catch((err) => {
                    console.log("Error getting receipt for transaction " + txHash)
                    console.log(err)
                    resolve({});
                });
        })
    }

    const latestInternal = async () => {
        return await web3.eth.getBlockNumber();
    }

    const isAddressInternal = (address) => {
        return Web3.utils.isAddress(address);
    }

    const sendLiquidationTransactionInternal = async (transactionData, user, orderNum) => {
        /// TODO
        // publish message
        // - nonce mgmt???
        const gasPrice = await web3.eth.getGasPrice()
        web3.eth.accounts.signTransaction({
            data: transactionData,
            gas: 200000,
            to: limitOrdersContractAddress,
            from: Config.getSignerAddress(),
            gasPrice: parseInt(gasPrice*1.05)
        }, Config.getSigner())
            .then(async (signedTx) => {
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        // tx sent
                        console.log('Liquidation tx sent for order ' + orderNum + ' for user ' + user);
                        //_________________
                        // publish new task
                        //=========================================================
                        Channel.publish('liquidationTxSent', {
                            user: user,
                            orderNum: orderNum
                        });
                        //=========================================================
                        //
                        //
                        //________________
                    })
                    .once('transactionHash', (hash) => {
                        // received hash
                        console.log(hash + ' received for order ' + orderNum + ' for user ' + user);
                        //_________________
                        // publish new task
                        //=========================================================
                        Channel.publish('liquidationTxHashReceived', {
                            user: user,
                            orderNum: orderNum,
                            hash: hash
                        });
                        //=========================================================
                        //
                        //
                        //________________
                    })
                    .once('receipt', (receipt) => {
                        // received receipt
                        console.log('Receipt received for order ' + orderNum + ' for user ' + user);
                        console.log(receipt);
                        //_________________
                        // publish new task
                        //=========================================================
                        Channel.publish('liquidationTxReceiptReceived', {
                            user: user,
                            orderNum: orderNum,
                            hash: receipt.transactionHash,
                            receipt: JSON.parse(JSON.stringify(receipt)),
                            status: receipt.status
                        });
                        //=========================================================
                        //
                        //
                        //________________
                    })
                    .on('error', (error) => {
                        // error sending tx
                        console.log('Error sending tx for order ' + orderNum + ' for user ' + user);
                        console.log(error);
                        //_________________
                        // publish new task
                        //=========================================================
                        Channel.publish('errorSendingLiquidationTx', {
                            user: user,
                            orderNum: orderNum,
                            error: error.message
                        });
                        //=========================================================
                        //
                        //
                        //________________
                    })
            })
            .catch((error) => {
                // error signing tx
                console.log('Error signing tx for order ' + orderNum + ' for user ' + user);
                console.log(error);
                //_________________
                // publish new task
                //=========================================================
                Channel.publish('errorSigningLiquidationTx', {
                    user: user,
                    orderNum: orderNum,
                    error: error.message
                });
                //=========================================================
                //
                //
                //________________
            })
    }

    // GET CHAIN ID
    // SIMULATE TX WITH ETH_CALL
    // ESTIMATE GAS

    return {
        getBlock: getBlockInternal,
        getLogs: getLogsInternal,
        getTransaction: getTransactionInternal,
        getTransactionReceipt: getTransactionReceiptInternal,
        connectWebsocket: connectWebsocketInternal,
        disconnectWebsocket: disconnectWebsocketInternal,
        connectHTTPWeb3: connectHTTPWeb3Internal,
        disconnectHTTPWeb3: disconnectHTTPWeb3Internal,
        isAddress: isAddressInternal,
        sendLiquidationTransaction: sendLiquidationTransactionInternal,
        latest: latestInternal,
    }
})();