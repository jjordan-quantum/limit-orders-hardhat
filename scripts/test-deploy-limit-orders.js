async function main() {

    // CONSTANTS

    const abiDecoder = require('abi-decoder');
    const txUtils = require('./tx-utils');
    const testUtils = require('./test-utils');
    const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const BUSD_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // STABLE TOKEN
    const USDC_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";  // PAYMENT TOKEN
    const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
    const USDCWBNB_ADDRESS = "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b"
    const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    const SELECTOR = 100;
    const SAFE_DEADLINE = 1640055247 + 592000;
    const BNB_AMOUNT = '10000000000000000000';
    const BNB_AMOUNT_0 = '20000000000000000000';
    const BNB_AMOUNT_1 = '30000000000000000000';
    const USDC_AMOUNT = '100000000'

    // CONTRACT FACTORIES

    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const ERC20 = await ethers.getContractFactory("ERC20");
    const Pair = await ethers.getContractFactory("UniswapV2Pair");
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const WETH = await ethers.getContractFactory("WETH");

    // ADD ABIS TO ABI DECODER

    abiDecoder.addABI(JSON.parse(Router.interface.format(ethers.utils.FormatTypes.json)));
    abiDecoder.addABI(JSON.parse(ERC20.interface.format(ethers.utils.FormatTypes.json)));
    abiDecoder.addABI(JSON.parse(Pair.interface.format(ethers.utils.FormatTypes.json)));
    abiDecoder.addABI(JSON.parse(Factory.interface.format(ethers.utils.FormatTypes.json)));
    abiDecoder.addABI(JSON.parse(WETH.interface.format(ethers.utils.FormatTypes.json)));

    // swap from BNB for payment token (USDC)

    const router = await Router.attach(
        ROUTER_ADDRESS // pancakeswap router
    );

    const SWAP_PATH = [
        WBNB_ADDRESS,
        USDC_ADDRESS
    ]

    const swapTx = await router.swapExactETHForTokens(
        0,
        SWAP_PATH,
        account,
        SAFE_DEADLINE,
        { value: BNB_AMOUNT }
    );
    const swapTxReceipt = await swapTx.wait();
    console.log("\nRouter swapExactETHForTokens Transaction Receipt\n")
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

    // deploy LimitOrders.sol

    const LimitOrders = await ethers.getContractFactory("LimitOrders");
    const limitOrders = await LimitOrders.deploy();
    console.log("LimitOrders deployed to:", limitOrders.address);

    const owner = await limitOrders.owner();
    console.log("LimitOrders owner: " + owner);

    // TEST - try create order (should fail)
    //==================================================================================================================

    testUtils.nextTestUsingCounter("Create order before contract set (should fail)")

    try {
        let createOrderTx = await limitOrders.createOrder(
            100,
            USDCWBNB_ADDRESS,
            BNB_AMOUNT,
            0,
            SAFE_DEADLINE,
            { value: BNB_AMOUNT }
        );
        let createOrderTxReceipt = await createOrderTx.wait();
        console.log("\nLimitOrders createOrder Transaction Receipt\n")
        txUtils.printReceipt(createOrderTxReceipt, abiDecoder);
    } catch(err) {
        console.log(err);
    }

    // TEST - set router
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set router")

    let setRouterTx = await limitOrders.setRouter(ROUTER_ADDRESS);
    let setRouterTxReceipt = await setRouterTx.wait();
    console.log("\nLimitOrders setRouter Transaction Receipt\n")
    txUtils.printReceipt(setRouterTxReceipt, abiDecoder);

    // TEST - set payment token and stable token
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set payment token and stable token")

    let setPaymentTokenTx = await limitOrders.setPaymentToken(USDC_ADDRESS);
    let setPaymentTokenTxReceipt = await setPaymentTokenTx.wait();
    console.log("\nLimitOrders setPaymentToken Transaction Receipt\n")
    txUtils.printReceipt(setPaymentTokenTxReceipt, abiDecoder);

    let setStableTokenTx = await limitOrders.setStableToken(BUSD_ADDRESS);
    let setStableTokenTxReceipt = await setStableTokenTx.wait();
    console.log("\nLimitOrders setStableToken Transaction Receipt\n")
    txUtils.printReceipt(setStableTokenTxReceipt, abiDecoder);

    // TEST - create orders
    //==================================================================================================================

    testUtils.nextTestUsingCounter("create 5 orders")

    for(let i = 0; i < 5; i++) {
        console.log()
        try {
            let createOrderTx = await limitOrders.createOrder(
                100,
                USDCWBNB_ADDRESS,
                BNB_AMOUNT,
                0,
                SAFE_DEADLINE,
                { value: BNB_AMOUNT }
            );
            let createOrderTxReceipt = await createOrderTx.wait();
            console.log("\nLimitOrders createOrder Transaction Receipt\n")
            txUtils.printReceipt(createOrderTxReceipt, abiDecoder);
        } catch(err) {
            console.log(err);
        }
    }

    // TEST - check order count
    //==================================================================================================================

    testUtils.nextTestUsingCounter("get order count - should be 5")

    let orderCount = await limitOrders.getOrderCount();
    console.log("LimitOrders orderCount: " + orderCount);

    // TEST - view order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("TEST 6 - view order [0]")

    let order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: " + order);

    // TEST - view invalid
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view invalid order [99] - should fail")

    try{
        order = await limitOrders.viewOrder(99);
        console.log("LimitOrders order[0]: " + order);
    } catch(err) {
        console.log(err);
    }

    // TEST - update order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order - amounts and deadline")

    let updateOrderTx = await limitOrders.updateOrder(
        0,
        BNB_AMOUNT_0,
        10,
        SAFE_DEADLINE + 10000,
        { value: BNB_AMOUNT }
    );
    let updateOrderTxReceipt = await updateOrderTx.wait();
    console.log("\nLimitOrders updateOrder Transaction Receipt\n")
    txUtils.printReceipt(updateOrderTxReceipt, abiDecoder);

    // TEST - view order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] after update")

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: " + order);

    // TEST - update order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order - omit deadline - should fail")

    try {
        updateOrderTx = await limitOrders.updateOrder(
            0,
            BNB_AMOUNT_0,
            10,
            0
        );
        updateOrderTxReceipt = await updateOrderTx.wait();
        console.log("\nLimitOrders updateOrder Transaction Receipt\n")
        txUtils.printReceipt(updateOrderTxReceipt, abiDecoder);
    } catch(err) {
        console.log(err);
    }

    // TEST - view order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] - should not have changed")

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: " + order);

    // TEST - delete orders
    //==================================================================================================================

    testUtils.nextTestUsingCounter("delete order [0]")

    let deleteOrderTx = await limitOrders.deleteOrder(0);
    let deleteOrderTxReceipt = await deleteOrderTx.wait();
    console.log("\nLimitOrders deleteOrder Transaction Receipt\n")
    txUtils.printReceipt(deleteOrderTxReceipt, abiDecoder);

    // TEST - check order count
    //==================================================================================================================

    testUtils.nextTestUsingCounter("get order count - should be 4")

    orderCount = await limitOrders.getOrderCount();
    console.log("LimitOrders orderCount: " + orderCount);

    // TEST - view order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] - should have changed")

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: " + order);

    // TEST - update order [0] deadline
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order [0] deadline")

    updateOrderTx = await limitOrders.updateOrderDeadline(
        0,
        SAFE_DEADLINE+20000
    );
    updateOrderTxReceipt = await updateOrderTx.wait();
    console.log("\nLimitOrders updateOrderDeadline Transaction Receipt\n")
    txUtils.printReceipt(updateOrderTxReceipt, abiDecoder);

    // TEST - view order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] - order deadline should have changed")

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: " + order);

    // TEST - update order [0] amounts
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order [0] amounts")

    updateOrderTx = await limitOrders.updateOrderAmounts(
        0,
        BNB_AMOUNT_0,
        10,
        { value: BNB_AMOUNT }
    );
    updateOrderTxReceipt = await updateOrderTx.wait();
    console.log("\nLimitOrders updateOrderAmounts Transaction Receipt\n")
    txUtils.printReceipt(updateOrderTxReceipt, abiDecoder);

    // TEST - view order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] - order amounts should have changed")

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: " + order);

    // TEST - update order [0] minOutputAMount
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order [0] deadline")

    updateOrderTx = await limitOrders.updateOrderMinOutputAmount(
        0,
        10000
    );
    updateOrderTxReceipt = await updateOrderTx.wait();
    console.log("\nLimitOrders updateOrderMinOutputAmount Transaction Receipt\n")
    txUtils.printReceipt(updateOrderTxReceipt, abiDecoder);

    // TEST - view order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] - order minOutputAmount should have changed")

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: " + order);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });