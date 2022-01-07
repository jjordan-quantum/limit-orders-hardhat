exports.Web3Requests = (function() {
    const { Channel } = require('./channel');
    const { Config } = require('./config');
    const Web3 = require('web3');
    const Web3Config = Config.getWeb3Config();
    const HTTPProvider = Web3Config.httpProvider;
    const WebsocketProvider = Web3Config.websocketProvider;
    let web3 = new Web3(HTTPProvider);

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


    let WSWeb3 = new Web3(new Web3.providers.WebsocketProvider(WebsocketProvider, options));

    const connectWebsocketInternal = () => {
        let WSWeb3 = new Web3(new Web3.providers.WebsocketProvider(WebsocketProvider, options));
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
            WSWeb3.eth.getBlock(number, full)
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
            WSWeb3.eth.getTransaction(txHash)
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
            WSWeb3.eth.getTransactionReceipt(txHash)
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

    // GET HIGHEST BLOCK
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
        disconnectHTTPWeb3: disconnectHTTPWeb3Internal
    }
})();