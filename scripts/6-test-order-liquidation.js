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
    const BUSDUSDC_ADDRESS = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"  // token0: BUSD, token1: USDC
    const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    const SELECTOR = 100;
    const SAFE_DEADLINE = Math.round((new Date()).getTime() / 1000) + 590000;
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

    // get WETH contract instance

    const weth = await WETH.attach(
        WBNB_ADDRESS
    );

    // get USDC contract instance

    const usdc = await ERC20.attach(USDC_ADDRESS);

    // swap from BNB for payment token (USDC)

    const router = await Router.attach(
        ROUTER_ADDRESS // pancakeswap router
    );

    const SWAP_PATH = [
        WBNB_ADDRESS,
        USDC_ADDRESS
    ]

    let swapTx = await router.swapExactETHForTokens(
        0,
        SWAP_PATH,
        account,
        SAFE_DEADLINE,
        { value: BNB_AMOUNT }
    );
    let swapTxReceipt = await swapTx.wait();
    console.log("\nRouter swapExactETHForTokens Transaction Receipt\n")
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

    let condition, success, selector, pair, owner;


    //==================================================================================================================
    //
    //  DEPLOY CONTRACTS
    //
    //==================================================================================================================

    // deploy LimitOrders.sol

    const LimitOrders = await ethers.getContractFactory("LimitOrders");
    const limitOrders = await LimitOrders.deploy();
    console.log("LimitOrders deployed to:", limitOrders.address);

    owner = await limitOrders.owner();
    console.log("LimitOrders owner: " + owner);

    // deploy SwapRouter.sol

    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    const swapRouter = await SwapRouter.deploy();
    console.log("SwapRouter deployed to:", swapRouter.address);

    owner = await swapRouter.owner();
    console.log("SwapRouter owner: " + owner);

    //==================================================================================================================
    //
    //  SET UP LIMITORDERS CONTRACT
    //
    //==================================================================================================================


    //==================================================================================================================
    // TEST - set SwapRouter
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set swapRouter");

    //  DEFINE TEST HERE!
    //===================================

    let setSwapRouterTx = await limitOrders.setSwapRouter(swapRouter.address);     // CHANGE THIS BEFORE LIQUIDATING
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
    // TEST - set paymentToken - USDC
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
    //
    //  SET UP SWAPROUTER CONTRACT
    //
    //==================================================================================================================


    //==================================================================================================================
    // TEST - set routerAddress
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set routerAddress");

    //  DEFINE TEST HERE!
    //===================================

    setRouterTx = await swapRouter.setRouter(ROUTER_ADDRESS);
    setRouterTxReceipt = await setRouterTx.wait();

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

    routerAddress = await swapRouter.routerAddress();

    condition = (routerAddress === ROUTER_ADDRESS);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set limitOrders
    //==================================================================================================================

    testUtils.nextTestUsingCounter("setLimitOrderContract");

    //  DEFINE TEST HERE!
    //===================================

    let setLimitOrderTx = await swapRouter.setLimitOrderContract(limitOrders.address);
    let setLimitOrderTxReceipt = await setLimitOrderTx.wait();

    condition = setLimitOrderTxReceipt.status;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
    //==================================================================================================================
    //
    //  TEST ORDER CREATION AND LIQUIDATION
    //
    //==================================================================================================================
    // ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
    //==================================================================================================================


    //==================================================================================================================
    //
    //  TEST 1 - Swap ETH -> Token
    //
    //  swapExactETHForTokens
    //  WBNB -> USDC
    //  selector: 100
    //
    //==================================================================================================================


    //==================================================================================================================
    // TEST - check create order
    //==================================================================================================================

    testUtils.nextTestUsingCounter("create order for Swap ETH -> Token")

    //  DEFINE TEST HERE!
    //===================================

    success = true;
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

    condition = (success);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - approve input token
    //==================================================================================================================

    testUtils.nextTestUsingCounter("appove input token")

    //  DEFINE TEST HERE!
    //===================================

    let approvalTx = await weth.approve(limitOrders.address, BNB_AMOUNT);
    let approvalTxReceipt = await approvalTx.wait();
    console.log(approvalTxReceipt)

    condition = (approvalTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - checkForLiquidation
    //==================================================================================================================

    testUtils.nextTestUsingCounter("checkForLiquidation");

    //  DEFINE TEST HERE!
    //===================================

    let canBeLiquidated = await limitOrders.checkForLiquidation(account, 0);

    condition = canBeLiquidated;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - liquidate
    //==================================================================================================================

    testUtils.nextTestUsingCounter("liquidate")

    //  DEFINE TEST HERE!
    //===================================

    let liquidateTx = await limitOrders.liquidate(account, 0);
    let liquidateTxReceipt = await liquidateTx.wait();
    txUtils.printReceipt(liquidateTxReceipt, abiDecoder);

    condition = (liquidateTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    //
    //  TEST 2 - Swap Token -> ETH
    //
    //  swapExactTokensForETH
    //  USDC -> WBNB
    //  selector: 121
    //
    //==================================================================================================================


    //==================================================================================================================
    // TEST - check create order
    //==================================================================================================================

    testUtils.nextTestUsingCounter("create order for Swap Token -> ETH")

    //  DEFINE TEST HERE!
    //===================================

    // get balance of USDC
    let usdcBalance = await usdc.balanceOf(account);
    console.log("BALANCE: " + usdcBalance)

    success = true;
    try {
        let createOrderTx = await limitOrders.createOrder(
            121,
            USDCWBNB_ADDRESS,
            usdcBalance,
            0,
            SAFE_DEADLINE
        );
        let createOrderTxReceipt = await createOrderTx.wait();
        console.log("\nLimitOrders createOrder Transaction Receipt\n")
        txUtils.printReceipt(createOrderTxReceipt, abiDecoder);
    } catch(err) {
        success = false
        console.log(err);
    }

    condition = (success);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - approve input token
    //==================================================================================================================

    testUtils.nextTestUsingCounter("appove input token")

    //  DEFINE TEST HERE!
    //===================================

    approvalTx = await usdc.approve(limitOrders.address, usdcBalance);
    approvalTxReceipt = await approvalTx.wait();
    console.log(approvalTxReceipt)

    condition = (approvalTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - checkForLiquidation
    //==================================================================================================================

    testUtils.nextTestUsingCounter("checkForLiquidation");

    //  DEFINE TEST HERE!
    //===================================

    canBeLiquidated = await limitOrders.checkForLiquidation(account, 0);

    condition = canBeLiquidated;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - liquidate
    //==================================================================================================================

    testUtils.nextTestUsingCounter("liquidate")

    //  DEFINE TEST HERE!
    //===================================

    liquidateTx = await limitOrders.liquidate(account, 0);
    liquidateTxReceipt = await liquidateTx.wait();
    txUtils.printReceipt(liquidateTxReceipt, abiDecoder);

    condition = (liquidateTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    //
    //  TEST 3 - Swap Token -> Token
    //
    //  swapExactTokensForTokens
    //  USDC -> BUSD
    //  selector: 140
    //
    //==================================================================================================================


    //==================================================================================================================
    // TEST - check create order
    //==================================================================================================================

    testUtils.nextTestUsingCounter("create order for Swap Token -> Token")

    //  DEFINE TEST HERE!
    //===================================

    // swap from BNB for payment token (USDC)

    swapTx = await router.swapExactETHForTokens(
        0,
        SWAP_PATH,
        account,
        SAFE_DEADLINE,
        { value: BNB_AMOUNT }
    );
    swapTxReceipt = await swapTx.wait();
    console.log("\nRouter swapExactETHForTokens Transaction Receipt\n")
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

    // get balance of USDC
    usdcBalance = await usdc.balanceOf(account);
    console.log("BALANCE: " + usdcBalance)

    success = true;
    try {
        let createOrderTx = await limitOrders.createOrder(
            140,
            BUSDUSDC_ADDRESS,
            usdcBalance,
            0,
            SAFE_DEADLINE
        );
        let createOrderTxReceipt = await createOrderTx.wait();
        console.log("\nLimitOrders createOrder Transaction Receipt\n")
        txUtils.printReceipt(createOrderTxReceipt, abiDecoder);
    } catch(err) {
        success = false
        console.log(err);
    }

    condition = (success);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - approve input token
    //==================================================================================================================

    testUtils.nextTestUsingCounter("appove input token")

    //  DEFINE TEST HERE!
    //===================================

    approvalTx = await usdc.approve(limitOrders.address, usdcBalance);
    approvalTxReceipt = await approvalTx.wait();
    console.log(approvalTxReceipt)

    condition = (approvalTxReceipt.status);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - checkForLiquidation
    //==================================================================================================================

    testUtils.nextTestUsingCounter("checkForLiquidation");

    //  DEFINE TEST HERE!
    //===================================

    canBeLiquidated = await limitOrders.checkForLiquidation(account, 0);

    condition = canBeLiquidated;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - liquidate
    //==================================================================================================================

    testUtils.nextTestUsingCounter("liquidate")

    //  DEFINE TEST HERE!
    //===================================

    liquidateTx = await limitOrders.liquidate(account, 0);
    liquidateTxReceipt = await liquidateTx.wait();
    txUtils.printReceipt(liquidateTxReceipt, abiDecoder);

    condition = (liquidateTxReceipt.status);

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