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

    // deploy SwapRouter.sol

    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    const swapRouter = await SwapRouter.deploy();
    console.log("SwapRouter deployed to:", swapRouter.address);

    const owner = await swapRouter.owner();
    console.log("SwapRouter owner: " + owner);


    let condition, success, selector, pair;


    //==================================================================================================================
    // TEST - set routerAddress
    //==================================================================================================================

    testUtils.nextTestUsingCounter("set routerAddress");

    //  DEFINE TEST HERE!
    //===================================

    let setRouterTx = await swapRouter.setRouter(ROUTER_ADDRESS);
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

    let routerAddress = await swapRouter.routerAddress();

    condition = (routerAddress === ROUTER_ADDRESS);

    //===================================
    //

    testUtils.assertConditionTrue(condition);



    //==================================================================================================================
    // TEST - check getInputToken
    //==================================================================================================================


    testUtils.nextTestUsingCounter("check isInputTokenWETH");

    //  DEFINE TEST HERE!
    //===================================

    selector = 100
    pair = USDCWBNB_ADDRESS //
    let inputToken = await swapRouter.getInputToken(selector, pair);

    condition = (inputToken.toLowerCase() === WBNB_ADDRESS.toLowerCase());

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - check getTokenPath
    //==================================================================================================================


    testUtils.nextTestUsingCounter("check isInputTokenWETH");

    //  DEFINE TEST HERE!
    //===================================

    selector = 100
    pair = USDCWBNB_ADDRESS //
    let tokenPath = await swapRouter.getInputToken(selector, pair);

    console.log(tokenPath)
    condition = tokenPath;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set limitOrders
    //==================================================================================================================

    testUtils.nextTestUsingCounter("setLimitOrderContract");

    //  DEFINE TEST HERE!
    //===================================

    let setLimitOrderTx = await swapRouter.setLimitOrderContract(account);  // sets to 'account' so swaps can be performed
    let setLimitOrderTxReceipt = await setLimitOrderTx.wait();

    condition = setLimitOrderTxReceipt.status;

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set swap - > swapExactETHForTokens (100, 101)
    //==================================================================================================================

    testUtils.nextTestUsingCounter("swapExactETHForTokens");

    //  DEFINE TEST HERE!
    //===================================

    // deposit WETH
    let wethDepositTx = await weth.deposit({ value: BNB_AMOUNT });
    let wethDepositTxReceipt = await wethDepositTx.wait();
    console.log(wethDepositTxReceipt)

    // transfer tokens (WETH) to SwapRouter contract before swapping
    let wethTransferTx = await weth.transfer(swapRouter.address, BNB_AMOUNT);
    let wethTransferTxReceipt = await wethTransferTx.wait();
    console.log(wethTransferTxReceipt)

    // execute swap
    let swapTx = await swapRouter.swap(
        100,
        USDCWBNB_ADDRESS,
        BNB_AMOUNT,
        0,
        account,
        SAFE_DEADLINE
    );
    let swapTxReceipt = await swapTx.wait();

    condition = swapTxReceipt.status && wethDepositTxReceipt.status && wethTransferTxReceipt.status;
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set swap - > swapExactETHForTokensSupportingFeeOnTransferTokens (110, 111)
    //==================================================================================================================

    testUtils.nextTestUsingCounter("swapExactETHForTokensSupportingFeeOnTransferTokens");

    //  DEFINE TEST HERE!
    //===================================

    // deposit WETH
    wethDepositTx = await weth.deposit({ value: BNB_AMOUNT });
    wethDepositTxReceipt = await wethDepositTx.wait();
    console.log(wethDepositTxReceipt)

    // transfer tokens (WETH) to SwapRouter contract before swapping
    wethTransferTx = await weth.transfer(swapRouter.address, BNB_AMOUNT);
    wethTransferTxReceipt = await wethTransferTx.wait();
    console.log(wethTransferTxReceipt)

    // execute swap
    swapTx = await swapRouter.swap(
        110,
        USDCWBNB_ADDRESS,
        BNB_AMOUNT,
        0,
        account,
        SAFE_DEADLINE
    );
    swapTxReceipt = await swapTx.wait();

    condition = swapTxReceipt.status && wethDepositTxReceipt.status && wethTransferTxReceipt.status;
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

    //===================================
    //

    testUtils.assertConditionTrue(condition);


    //==================================================================================================================
    // TEST - set swap - > swapExactTokensForETH (120, 121)
    //==================================================================================================================

    testUtils.nextTestUsingCounter("swapExactTokensForETH");

    //  DEFINE TEST HERE!
    //===================================

    // get balance of USDC
    let usdcBalance = await usdc.balanceOf(account);
    console.log("BALANCE: " + usdcBalance)

    // transfer tokens (USDC) to SwapRouter contract before swapping
    console.log("Transferring tokens to SwapRouter")
    let tokenTransferTx = await usdc.transfer(swapRouter.address, usdcBalance);
    let tokenTransferTxReceipt = await tokenTransferTx.wait();
    txUtils.printReceipt(tokenTransferTxReceipt, abiDecoder);

    // execute swap
    console.log("Swapping...")
    swapTx = await swapRouter.swap(
        121,
        USDCWBNB_ADDRESS,
        usdcBalance,
        0,
        account,
        SAFE_DEADLINE
    );
    swapTxReceipt = await swapTx.wait();

    condition = swapTxReceipt.status && tokenTransferTxReceipt.status;
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

    //===================================
    //

    testUtils.assertConditionTrue(condition);

    //==================================================================================================================
    // TEST - set swap - > swapExactTokensForETHSupportingFeeOnTransferTokens (130, 131)
    //==================================================================================================================

    testUtils.nextTestUsingCounter("swapExactTokensForETHSupportingFeeOnTransferTokens");

    //  DEFINE TEST HERE!
    //===================================

    // swap from BNB for payment token (USDC)

    const router = await Router.attach(
        ROUTER_ADDRESS // pancakeswap router
    );

    let SWAP_PATH = [
        WBNB_ADDRESS,
        USDC_ADDRESS
    ]

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

    // transfer tokens (USDC) to SwapRouter contract before swapping
    console.log("Transferring tokens to SwapRouter")
    tokenTransferTx = await usdc.transfer(swapRouter.address, usdcBalance);
    tokenTransferTxReceipt = await tokenTransferTx.wait();
    txUtils.printReceipt(tokenTransferTxReceipt, abiDecoder);

    // execute swap
    console.log("Swapping...")
    swapTx = await swapRouter.swap(
        131,
        USDCWBNB_ADDRESS,
        usdcBalance,
        0,
        account,
        SAFE_DEADLINE
    );
    swapTxReceipt = await swapTx.wait();

    condition = swapTxReceipt.status && tokenTransferTxReceipt.status;
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

    //===================================
    //

    testUtils.assertConditionTrue(condition);

    //==================================================================================================================
    // TEST - set swap - > swapExactTokensForTokens (140, 141)
    //==================================================================================================================

    testUtils.nextTestUsingCounter("swapExactTokensForTokens");

    //  DEFINE TEST HERE!
    //===================================

    // swap from BNB for payment token (USDC)

    SWAP_PATH = [
        WBNB_ADDRESS,
        USDC_ADDRESS
    ]

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

    // transfer tokens (USDC) to SwapRouter contract before swapping
    console.log("Transferring tokens to SwapRouter")
    tokenTransferTx = await usdc.transfer(swapRouter.address, usdcBalance);
    tokenTransferTxReceipt = await tokenTransferTx.wait();
    txUtils.printReceipt(tokenTransferTxReceipt, abiDecoder);

    // execute swap
    console.log("Swapping...")
    swapTx = await swapRouter.swap(
        140,
        BUSDUSDC_ADDRESS,
        usdcBalance,
        0,
        account,
        SAFE_DEADLINE
    );
    swapTxReceipt = await swapTx.wait();

    condition = swapTxReceipt.status && tokenTransferTxReceipt.status;
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

    //===================================
    //

    testUtils.assertConditionTrue(condition);

    //==================================================================================================================
    // TEST - set swap - > swapExactTokensForTokensSupportingFeeOnTransferTokens (150, 151)
    //==================================================================================================================

    testUtils.nextTestUsingCounter("swapExactTokensForTokensSupportingFeeOnTransferTokens");

    //  DEFINE TEST HERE!
    //===================================

    // swap from BNB for payment token (USDC)

    SWAP_PATH = [
        WBNB_ADDRESS,
        USDC_ADDRESS
    ]

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

    // transfer tokens (USDC) to SwapRouter contract before swapping
    console.log("Transferring tokens to SwapRouter")
    tokenTransferTx = await usdc.transfer(swapRouter.address, usdcBalance);
    tokenTransferTxReceipt = await tokenTransferTx.wait();
    txUtils.printReceipt(tokenTransferTxReceipt, abiDecoder);

    // execute swap
    console.log("Swapping...")
    swapTx = await swapRouter.swap(
        150,
        BUSDUSDC_ADDRESS,
        usdcBalance,
        0,
        account,
        SAFE_DEADLINE
    );
    swapTxReceipt = await swapTx.wait();

    condition = swapTxReceipt.status && tokenTransferTxReceipt.status;
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

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