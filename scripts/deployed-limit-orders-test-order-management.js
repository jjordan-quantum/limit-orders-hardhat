require('dotenv').config();
const { ethers } = require("hardhat");
const FormatTypes = ethers.utils.FormatTypes;
const util = require('util');
const fs = require('fs');
const Web3 = require('web3');
const PROVIDER_LOCAL = process.env.PROVIDER_LOCAL;
const PROVIDER_LIVE = process.env.PROVIDER_LIVE;

// FOR TESTING ON LOCAL FORK
//const web3 = new Web3(PROVIDER_LOCAL);

// FOR EXECUTING ON LIVE NETWORK
const web3 = new Web3(PROVIDER_LIVE);

const limitOrdersJSON_data = fs.readFileSync('./artifacts/contracts/limit-order/LimitOrders.sol/LimitOrders.json');
const LIMIT_ORDERS_ABI = JSON.parse(limitOrdersJSON_data).abi;

const IERCOJSON_data = fs.readFileSync('./artifacts/contracts/token-libraries/IERC20.sol/IERC20.json');
const IERC20_ABI = JSON.parse(IERCOJSON_data).abi;

const swapRouterJSON_data = fs.readFileSync('./artifacts/contracts/limit-order/SwapRouter.sol/SwapRouter.json');
const SWAP_ROUTER_ABI = JSON.parse(swapRouterJSON_data).abi;

const BUSD_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // STABLE TOKEN
const USDC_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";  // PAYMENT TOKEN
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDCWBNB_ADDRESS = "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b";
const BUSDUSDC_ADDRESS = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"; // token0: BUSD, token1: USDC
const SELECTOR = 100;
const SAFE_DEADLINE = Math.round((new Date()).getTime() / 1000) + 590000;
const BNB_TO_SWAP_FOR_PAYMENT_TOKEN = '100000000000000000';
const BNB_AMOUNT = '1000000000000000';
const BNB_AMOUNT_0 = '2000000000000000';
const BNB_AMOUNT_1 = '3000000000000000';
const USDC_AMOUNT = '1000000'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const SAFE_GAS_FEES = '7500000000000000'
const BUSD_USDC = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"

const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN;
const STABLE_TOKEN = process.env.STABLE_TOKEN;
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
const PAYMENT_TOKEN_ROUTER_ADDRESS = process.env.PAYMENT_TOKEN_ROUTER_ADDRESS;
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS;
const DEPLOYER = process.env.DEPLOYER;
const LIMIT_ORDERS_ADDRESS = process.env.LIMIT_ORDERS_ADDRESS;
const SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;

console.log(LIMIT_ORDERS_ADDRESS);

const deepConsoleLog = (message) => {
    console.log(util.inspect(message, false, null, true));
}

(async() => {

    //const LimitOrders = await ethers.getContractFactory("LimitOrders");
    //const LIMIT_ORDERS_ABI = LimitOrders.interface.format(FormatTypes.json);
    const limitOrders = new web3.eth.Contract(
        LIMIT_ORDERS_ABI,
        LIMIT_ORDERS_ADDRESS
    );

    const WBNB = new web3.eth.Contract(
        IERC20_ABI,
        WBNB_ADDRESS
    );

    const swapRouter = new web3.eth.Contract(
        SWAP_ROUTER_ABI,
        SWAP_ROUTER_ADDRESS
    );

    const paymentToken = new web3.eth.Contract(
        IERC20_ABI,
        PAYMENT_TOKEN
    );

    // check if contract is set
    await new Promise((resolve, reject) => {
        console.log('\nContract is set:');
        console.log('===================================================\n');
        limitOrders.methods.contractSet().call()
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    let nonce = await web3.eth.getTransactionCount(DEPLOYER_ADDRESS);
    let orderCount;
    // check order count
    await new Promise((resolve, reject) => {
        console.log('\nOrder count:');
        console.log('===================================================\n');

        limitOrders.methods.getOrderCount().call(
            {
                from: DEPLOYER_ADDRESS
            }
        )
            .then((result) => {
                console.log(result);
                orderCount = result;
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    async function createOrder() {
        // create one order
        const txCount = await web3.eth.getTransactionCount(DEPLOYER_ADDRESS);
        await new Promise((resolve, reject) => {
            console.log('\nCreating order:');
            console.log('===================================================\n');

            const createOrderFunctionCall = limitOrders.methods.createOrder(
                100,
                USDCWBNB_ADDRESS,
                BNB_AMOUNT,
                0,
                SAFE_DEADLINE,
            );

            const txData = createOrderFunctionCall.encodeABI();

            const transactionObject = {
                from: DEPLOYER_ADDRESS,
                to: LIMIT_ORDERS_ADDRESS,
                data: txData,
                value: BNB_AMOUNT,
                gas: 300000,
                nonce: txCount
            }

            web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
                .then(async (signedTx) => {
                    console.log('Transaction signed.');
                    await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                        .once('sent', (payload) => {
                            console.log('Transaction sent.');
                        })
                        .once('transactionHash', (hash) => {
                            console.log('Transaction hash received:');
                            console.log(hash);
                        })
                        .once('receipt', (receipt) => {
                            console.log('Transaction receipt received:');
                            deepConsoleLog(receipt);
                            resolve();
                        })
                        .catch((err) => {
                            console.log('Error sending transaction:');
                            console.log(err);
                            resolve();
                        })
                })
                .catch((err) => {
                    console.log('Error signing transaction:');
                    console.log(err);
                    resolve();
                });
        });
    }

    for (let i = 0; i < 5; i++) {

        await createOrder();

        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }

    process.exit();

    async function liquidate() {
        for(let i = 0; i < orderCount; i++) {
            const orderNum = i;
            console.log('\nCheck for liquidation for order: ' + orderNum);
            console.log('===================================================\n');

            const order = await limitOrders.methods.viewOrder(orderNum).call(
                {from: DEPLOYER_ADDRESS}
            );
            if(order && order.isOrderActive) {
                await new Promise((resolve, reject) => {
                    limitOrders.methods.checkForLiquidation(DEPLOYER_ADDRESS, orderNum).call()
                        .then(async (result) => {
                            console.log('Check for liquidation result: ' + result);
                            if(result) {
                                await new Promise((resolve1, reject1) => {

                                    console.log('\nLiquidating order: ' + orderNum);
                                    console.log('===================================================\n');

                                    const liquidateOrderFunctionCall = limitOrders.methods.liquidate(DEPLOYER_ADDRESS, orderNum);

                                    const txData = liquidateOrderFunctionCall.encodeABI();

                                    nonce++;
                                    const transactionObject = {
                                        from: DEPLOYER_ADDRESS,
                                        to: LIMIT_ORDERS_ADDRESS,
                                        data: txData,
                                        gas: 300000,
                                        //nonce: nonce
                                    }

                                    web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
                                        .then(async (signedTx) => {
                                            console.log('Transaction signed.');
                                            await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                                                .once('sent', (payload) => {
                                                    console.log('Transaction sent.');
                                                })
                                                .once('transactionHash', (hash) => {
                                                    console.log('Transaction hash received:');
                                                    console.log(hash);
                                                })
                                                .once('receipt', (receipt) => {
                                                    console.log('Transaction receipt received:');
                                                    deepConsoleLog(receipt);
                                                    resolve1();
                                                })
                                                .catch((err) => {
                                                    console.log('Error sending transaction:');
                                                    console.log(err);
                                                    resolve1();
                                                })
                                        })
                                        .catch((err) => {
                                            console.log('Error signing transaction:');
                                            console.log(err);
                                            resolve1();
                                        });
                                });
                            }

                            resolve();
                        })
                        .catch((err) => {
                            console.log('Error checking for liquidation:');
                            try {
                                console.log(err.toString().split('\n')[0]);
                            } catch(error) {
                                console.log(error);
                            }
                            resolve();
                        });
                });
            }

            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, 3000);
            });
        }
    }
    await liquidate();

    process.exit();

    /*
   // authorize oracle
   await new Promise((resolve, reject) => {
       console.log('\nAuthorize oracle:');
       console.log('===================================================\n');

       const authorizeFunctionCall = limitOrders.methods.authorizeOracle("0xbA78F5d2623bC7189D20e204C74C84ee6d4F3349");

       const txData = authorizeFunctionCall.encodeABI();

       nonce++;
       const transactionObject = {
           from: DEPLOYER_ADDRESS,
           to: LIMIT_ORDERS_ADDRESS,
           data: txData,
           gas: 300000
       }

       web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
           .then(async (signedTx) => {
               console.log('Transaction signed.');
               await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                   .once('sent', (payload) => {
                       console.log('Transaction sent.');
                   })
                   .once('transactionHash', (hash) => {
                       console.log('Transaction hash received:');
                       console.log(hash);
                   })
                   .once('receipt', (receipt) => {
                       console.log('Transaction receipt received:');
                       deepConsoleLog(receipt);
                       resolve();
                   })
                   .catch((err) => {
                       console.log('Error sending transaction:');
                       console.log(err);
                       resolve();
                   })
           })
           .catch((err) => {
               console.log('Error signing transaction:');
               console.log(err);
               resolve();
           });
   });

   process.exit();

   // set limitorders in payment router
   await new Promise((resolve, reject) => {
       console.log('\nSetting limit order address in swap router:');
       console.log('===================================================\n');

       const setLimitOrderFunctionCall = swapRouter.methods.setLimitOrderContract(
           LIMIT_ORDERS_ADDRESS
       );

       const txData = setLimitOrderFunctionCall.encodeABI();

       const transactionObject = {
           from: DEPLOYER_ADDRESS,
           to: SWAP_ROUTER_ADDRESS,
           data: txData,
           gas: 150000,
           nonce: nonce
       }

       web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
           .then(async (signedTx) => {
               console.log('Transaction signed.');
               await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                   .once('sent', (payload) => {
                       console.log('Transaction sent.');
                   })
                   .once('transactionHash', (hash) => {
                       console.log('Transaction hash received:');
                       console.log(hash);
                   })
                   .once('receipt', (receipt) => {
                       console.log('Transaction receipt received:');
                       deepConsoleLog(receipt);
                       resolve();
                   })
                   .catch((err) => {
                       console.log('Error sending transaction:');
                       console.log(err);
                       resolve();
                   })
           })
           .catch((err) => {
               console.log('Error signing transaction:');
               console.log(err);
               resolve();
           });
   });

   // set router address in payment router
   await new Promise((resolve, reject) => {
       console.log('\nSetting router address in swap router:');
       console.log('===================================================\n');

       const setRouterFunctionCall = swapRouter.methods.setRouter(
           ROUTER_ADDRESS
       );

       const txData = setRouterFunctionCall.encodeABI();

       nonce++;
       const transactionObject = {
           from: DEPLOYER_ADDRESS,
           to: SWAP_ROUTER_ADDRESS,
           data: txData,
           gas: 150000,
           nonce: nonce
       }

       web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
           .then(async (signedTx) => {
               console.log('Transaction signed.');
               await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                   .once('sent', (payload) => {
                       console.log('Transaction sent.');
                   })
                   .once('transactionHash', (hash) => {
                       console.log('Transaction hash received:');
                       console.log(hash);
                   })
                   .once('receipt', (receipt) => {
                       console.log('Transaction receipt received:');
                       deepConsoleLog(receipt);
                       resolve();
                   })
                   .catch((err) => {
                       console.log('Error sending transaction:');
                       console.log(err);
                       resolve();
                   })
           })
           .catch((err) => {
               console.log('Error signing transaction:');
               console.log(err);
               resolve();
           });
   });

    */

    // check for liquidation
    await new Promise((resolve, reject) => {
        console.log('\nCheck for liquidation:');
        console.log('===================================================\n');

        limitOrders.methods.checkForLiquidation(DEPLOYER_ADDRESS, 1).call()
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });


    /*
    // approve WBNB
    await new Promise((resolve, reject) => {
        console.log('\nApproving WBNB:');
        console.log('===================================================\n');

        const approveFunctionCall = WBNB.methods.approve(
            LIMIT_ORDERS_ADDRESS,
            "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        );

        const txData = approveFunctionCall.encodeABI();

        nonce++;
        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: WBNB_ADDRESS,
            data: txData,
            gas: 100000,
            nonce: nonce
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
                console.log('Error signing transaction:');
                console.log(err);
                resolve();
            });
    });



    // approve payment token
    await new Promise((resolve, reject) => {
        console.log('\nApproving paymentToken:');
        console.log('===================================================\n');

        const approveFunctionCall = paymentToken.methods.approve(
            LIMIT_ORDERS_ADDRESS,
            "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        );

        const txData = approveFunctionCall.encodeABI();

        //nonce++;
        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: PAYMENT_TOKEN,
            data: txData,
            gas: 100000,
            nonce: nonce
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
                console.log('Error signing transaction:');
                console.log(err);
                resolve();
            });
    });


    // liquidate
    await new Promise((resolve, reject) => {
        console.log('\nLiquidating order:');
        console.log('===================================================\n');

        const liquidateOrderFunctionCall = limitOrders.methods.liquidate(DEPLOYER_ADDRESS, 1);

        const txData = liquidateOrderFunctionCall.encodeABI();

        nonce++;
        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: LIMIT_ORDERS_ADDRESS,
            data: txData,
            gas: 300000,
            nonce: nonce
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
                console.log('Error signing transaction:');
                console.log(err);
                resolve();
            });
    });

    process.exit();
     */

    // create one order
    await new Promise((resolve, reject) => {
        console.log('\nCreating order:');
        console.log('===================================================\n');

        const createOrderFunctionCall = limitOrders.methods.createOrder(
            100,
            USDCWBNB_ADDRESS,
            BNB_AMOUNT,
            0,
            SAFE_DEADLINE,
        );

        const txData = createOrderFunctionCall.encodeABI();

        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: LIMIT_ORDERS_ADDRESS,
            data: txData,
            value: BNB_AMOUNT,
            gas: 300000
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
               console.log('Error signing transaction:');
               console.log(err);
                resolve();
            });
    });

    // check order count
    // check order count
    await new Promise((resolve, reject) => {
        console.log('\nOrder count:');
        console.log('===================================================\n');

        limitOrders.methods.getOrderCount().call(
            {
                from: DEPLOYER_ADDRESS
            }
        )
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    process.exit();


    // create one order
    await new Promise((resolve, reject) => {
        console.log('\nCreating order:');
        console.log('===================================================\n');

        const createOrderFunctionCall = limitOrders.methods.createOrder(
            100,
            USDCWBNB_ADDRESS,
            BNB_AMOUNT,
            0,
            SAFE_DEADLINE,
        );

        const txData = createOrderFunctionCall.encodeABI();

        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: LIMIT_ORDERS_ADDRESS,
            data: txData,
            value: BNB_AMOUNT,
            gas: 300000,
            nonce: nonce1
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
                console.log('Error signing transaction:');
                console.log(err);
                resolve();
            });
    });

    // check order count
    await new Promise((resolve, reject) => {
        console.log('\nOrder count:');
        console.log('===================================================\n');

        limitOrders.methods.getOrderCount().call(
            {
                from: DEPLOYER_ADDRESS
            }
        )
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    // view order
    await new Promise((resolve, reject) => {
        console.log('\nView Order:');
        console.log('===================================================\n');

        limitOrders.methods.viewOrder(0).call(
            {
                from: DEPLOYER_ADDRESS
            }
        )
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    // delete order
    await new Promise((resolve, reject) => {
        console.log('\nDeleting order:');
        console.log('===================================================\n');

        const deleteOrderFunctionCall = limitOrders.methods.deleteOrder(0);

        const txData = deleteOrderFunctionCall.encodeABI();

        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: LIMIT_ORDERS_ADDRESS,
            data: txData,
            gas: 300000,
            nonce: nonce1+1
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
                console.log('Error signing transaction:');
                console.log(err);
                resolve();
            });
    });

    // check order count
    await new Promise((resolve, reject) => {
        console.log('\nOrder count:');
        console.log('===================================================\n');

        limitOrders.methods.getOrderCount().call(
            {
                from: DEPLOYER_ADDRESS
            }
        )
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    // update order
    await new Promise((resolve, reject) => {
        console.log('\nUpdating order:');
        console.log('===================================================\n');

        const updateOrderFunctionCall = limitOrders.methods.updateOrder(
            1,
            BNB_AMOUNT_0,
            10,
            SAFE_DEADLINE
        );

        const txData = updateOrderFunctionCall.encodeABI();

        const transactionObject = {
            from: DEPLOYER_ADDRESS,
            to: LIMIT_ORDERS_ADDRESS,
            data: txData,
            gas: 300000,
            value: BNB_AMOUNT,
            nonce: nonce1+2
        }

        web3.eth.accounts.signTransaction(transactionObject, DEPLOYER)
            .then(async (signedTx) => {
                console.log('Transaction signed.');
                await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('sent', (payload) => {
                        console.log('Transaction sent.');
                    })
                    .once('transactionHash', (hash) => {
                        console.log('Transaction hash received:');
                        console.log(hash);
                    })
                    .once('receipt', (receipt) => {
                        console.log('Transaction receipt received:');
                        deepConsoleLog(receipt);
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Error sending transaction:');
                        console.log(err);
                        resolve();
                    })
            })
            .catch((err) => {
                console.log('Error signing transaction:');
                console.log(err);
                resolve();
            });
    });

    // view order
    await new Promise((resolve, reject) => {
        console.log('\nView Order:');
        console.log('===================================================\n');

        limitOrders.methods.viewOrder(1).call(
            {
                from: DEPLOYER_ADDRESS
            }
        )
            .then((result) => {
                console.log(result);
                resolve();
            })
            .catch((err) => {
                console.log('Error:');
                console.log(err);
                resolve();
            });
    });

    // update order amounts
    //

})()
    .catch((err) => {
        console.log(err);
    });