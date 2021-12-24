async function main() {

    // CONSTANTS

    const abiDecoder = require('abi-decoder');
    const txUtils = require('./tx-utils');
    const testUtils = require('./test-utils');
    const util = require('util')
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
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const SAFE_GAS_FEES = '7500000000000000'

    const BUSD_USDC = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"

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
    //txUtils.printReceipt(swapTxReceipt, abiDecoder);

    // deploy LimitOrders.sol

    const LimitOrders = await ethers.getContractFactory("LimitOrders");
    const limitOrders = await LimitOrders.deploy();
    console.log("LimitOrders deployed to:", limitOrders.address);

    const owner = await limitOrders.owner();
    console.log("LimitOrders owner: " + owner);

    let condition;
    let success;


    //==================================================================================================================
    // TEST - try create order (should fail)
    //==================================================================================================================

    /*
     *  NOTE
     *
     * createOrder requires the following:
     *
     * - contract is set:
     *      - contractSet
     *      - paymentTokenSet
     *      - stableTokenSet
     *      - routerSet
     * - valid selector b/w 90 and 171
     * - user has payment token
     * - deadline < 30 days
     * - deadline > current block timestamp
     *
     */

    testUtils.nextTestUsingCounter("Create order before contract set (should fail)")

    //  DEFINE TEST HERE!
    //===================================

    success = false;

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
        success = true;
    } catch(err) {
        console.log(err);
    }

    condition = !success

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set SwapRouter
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set routerAddress");

    //  DEFINE TEST HERE!
    //===================================

    let setSwapRouterTx = await limitOrders.setSwapRouter(ZERO_ADDRESS);     // CHANGE THIS BEFORE LIQUIDATING
    let setSwapRouterTxReceipt = await setSwapRouterTx.wait();

    condition = setSwapRouterTxReceipt.status;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set routerAddress
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set routerAddress");

    //  DEFINE TEST HERE!
    //===================================

    let setRouterTx = await limitOrders.setRouter(ROUTER_ADDRESS);
    let setRouterTxReceipt = await setRouterTx.wait();

    condition = setRouterTxReceipt.status;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check routerAddress
    //==================================================================================================================

    testUtils.nextTestUsingCounter("check routerAddress");

    //  DEFINE TEST HERE!
    //===================================

    let routerAddress = await limitOrders.routerAddress();

    condition = (routerAddress === ROUTER_ADDRESS);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check routerSet
    //==================================================================================================================

    testUtils.nextTestUsingCounter("check routerSet");

    //  DEFINE TEST HERE!
    //===================================

    let routerSet = await limitOrders.routerSet();

    condition = (routerSet);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check wethAddress
    //==================================================================================================================

    testUtils.nextTestUsingCounter("check wethAddress");

    //  DEFINE TEST HERE!
    //===================================

    let wethAddress = await limitOrders.wethAddress();

    condition = (wethAddress === WBNB_ADDRESS);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set paymentToken
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set paymentToken");

    //  DEFINE TEST HERE!
    //===================================

    let setPaymentTokenTx = await limitOrders.setPaymentToken(USDC_ADDRESS);
    let setPaymentTokenTxReceipt = await setPaymentTokenTx.wait();

    condition = setPaymentTokenTxReceipt.status;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check paymentToken
    //==================================================================================================================

    testUtils.nextTestUsingCounter("check paymentToken");

    //  DEFINE TEST HERE!
    //===================================

    let paymentToken = await limitOrders.paymentToken();

    condition = (paymentToken === USDC_ADDRESS);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check paymentTokenSet
    //==================================================================================================================

    testUtils.nextTestUsingCounter("check paymentTokenSet");

    //  DEFINE TEST HERE!
    //===================================

    let paymentTokenSet = await limitOrders.paymentTokenSet();

    condition = (paymentTokenSet);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set stableToken
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set stableToken");

    //  DEFINE TEST HERE!
    //===================================

    let setStableTokenTx = await limitOrders.setStableToken(BUSD_ADDRESS);
    let setStableTokenTxReceipt = await setStableTokenTx.wait();

    condition = setStableTokenTxReceipt.status;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check stableToken
    //==================================================================================================================

    testUtils.nextTestUsingCounter("check stableToken");

    //  DEFINE TEST HERE!
    //===================================

    let stableToken = await limitOrders.stableToken();

    condition = (stableToken === BUSD_ADDRESS);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check stableTokenSet
    //==================================================================================================================

    testUtils.nextTestUsingCounter("check stableTokenSet");

    //  DEFINE TEST HERE!
    //===================================

    let stableTokenSet = await limitOrders.stableTokenSet();

    condition = (stableTokenSet);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check contractSet
    //==================================================================================================================

    testUtils.nextTestUsingCounter("check contractSet");

    //  DEFINE TEST HERE!
    //===================================

    let contractSet = await limitOrders.contractSet();

    condition = (contractSet);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check create orders
    //==================================================================================================================


    testUtils.nextTestUsingCounter("create 5 orders")

    //  DEFINE TEST HERE!
    //===================================

    success = true;
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
            success = false
            console.log(err);
        }
    }

    condition = (success);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check order count
    //==================================================================================================================

    testUtils.nextTestUsingCounter("get order count - should be 5")

    //  DEFINE TEST HERE!
    //===================================

    let orderCount = await limitOrders.getOrderCount();
    console.log("LimitOrders orderCount: " + orderCount);

    condition = (parseInt(orderCount) === 5);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - view order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0]")

    //  DEFINE TEST HERE!
    //===================================

    let order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: ");
    console.log(util.inspect(order, false, null, true));

    condition = (order);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - view invalid
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view invalid order [99] - should fail")

    //  DEFINE TEST HERE!
    //===================================

    success - true;
    try{
        order = await limitOrders.viewOrder(99);
        console.log("LimitOrders order[0]: " + order);
    } catch(err) {
        success = false
        console.log(err);
    }
    condition = (!success);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - update order [0]
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order - amounts and deadline")

    //  DEFINE TEST HERE!
    //===================================

    success - true;
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

    condition = (updateOrderTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - view order [0] after update
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] after update")

    //  DEFINE TEST HERE!
    //===================================

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: ");
    console.log(util.inspect(order, false, null, true));

    condition = (order && order.inputAmount == BNB_AMOUNT_0);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - update order - omit deadline - should fail
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order - omit deadline - should fail")

    //  DEFINE TEST HERE!
    //===================================

    success - true;
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
        success = false
        console.log(err);
    }

    condition = !success;

    //===================================
    //

    testUtils.assertConditionTrue(condition);

    //==================================================================================================================
    // TEST - view order [0] after update - should not have changed
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] after update")

    //  DEFINE TEST HERE!
    //===================================

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: ");
    console.log(util.inspect(order, false, null, true));

    condition = (order && order.inputAmount == BNB_AMOUNT_0);

    //===================================
    //

    testUtils.assertConditionTrue(condition);



    //==================================================================================================================
    // TEST - delete orders
    //==================================================================================================================

    testUtils.nextTestUsingCounter("delete order [0]")

    //  DEFINE TEST HERE!
    //===================================

    success - true;
    let deleteOrderTx = await limitOrders.deleteOrder(0);
    let deleteOrderTxReceipt = await deleteOrderTx.wait();
    console.log("\nLimitOrders deleteOrder Transaction Receipt\n")
    txUtils.printReceipt(deleteOrderTxReceipt, abiDecoder);

    condition = (deleteOrderTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check order count
    //==================================================================================================================

    testUtils.nextTestUsingCounter("get order count - should be 4");

    //  DEFINE TEST HERE!
    //===================================

    orderCount = await limitOrders.getOrderCount();
    console.log("LimitOrders orderCount: " + orderCount);

    condition = (parseInt(orderCount) === 4);

    //===================================
    //

    testUtils.assertConditionTrue(condition);

    //==================================================================================================================
    // TEST - view order [0] after update
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0]e")

    //  DEFINE TEST HERE!
    //===================================

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: ");
    console.log(util.inspect(order, false, null, true));

    condition = (order);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - update order [0] deadline
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order [0] deadline")

    //  DEFINE TEST HERE!
    //===================================

    success - true;
    updateOrderTx = await limitOrders.updateOrderDeadline(
        0,
        SAFE_DEADLINE+20000
    );
    updateOrderTxReceipt = await updateOrderTx.wait();
    console.log("\nLimitOrders updateOrderDeadline Transaction Receipt\n")
    txUtils.printReceipt(updateOrderTxReceipt, abiDecoder);

    condition = (updateOrderTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - view order [0] after update - deadline should be different
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] after update")

    //  DEFINE TEST HERE!
    //===================================

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: ");
    console.log(util.inspect(order, false, null, true));

    condition = (order);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - update order [0] amounts
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order [0] amounts")

    //  DEFINE TEST HERE!
    //===================================

    success - true;
    updateOrderTx = await limitOrders.updateOrderAmounts(
        0,
        BNB_AMOUNT_0,
        10,
        { value: BNB_AMOUNT }
    );
    updateOrderTxReceipt = await updateOrderTx.wait();
    console.log("\nLimitOrders updateOrderAmounts Transaction Receipt\n")
    txUtils.printReceipt(updateOrderTxReceipt, abiDecoder);

    condition = (updateOrderTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - view order [0] after update - should not have changed
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] after update")

    //  DEFINE TEST HERE!
    //===================================

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: ");
    console.log(util.inspect(order, false, null, true));

    condition = (order && order.inputAmount == BNB_AMOUNT_0);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - update order [0] minOutputAMount
    //==================================================================================================================

    testUtils.nextTestUsingCounter("update order [0] deadline")

    //  DEFINE TEST HERE!
    //===================================

    success - true;
    updateOrderTx = await limitOrders.updateOrderMinOutputAmount(
        0,
        10000
    );
    updateOrderTxReceipt = await updateOrderTx.wait();
    console.log("\nLimitOrders updateOrderMinOutputAmount Transaction Receipt\n")
    txUtils.printReceipt(updateOrderTxReceipt, abiDecoder);

    condition = (updateOrderTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - view order [0] after update - should not have changed
    //==================================================================================================================

    testUtils.nextTestUsingCounter("view order [0] after update")

    //  DEFINE TEST HERE!
    //===================================

    order = await limitOrders.viewOrder(0);
    console.log("LimitOrders order[0]: ");
    console.log(util.inspect(order, false, null, true));

    condition = (order);

    //===================================
    //

    testUtils.assertConditionTrue(condition);




    // FINISHED!
    //===================================
    testUtils.printResults();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });