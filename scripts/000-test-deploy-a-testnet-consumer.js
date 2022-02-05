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
    const BUSDUSDC_ADDRESS = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"  // token0: BUSD, token1: USDC
    const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    const UNIV2_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    const SELECTOR = 100;
    const SAFE_DEADLINE = Math.round((new Date()).getTime() / 1000) + 590000;
    const BNB_AMOUNT = '10000000000000000000';
    const BNB_AMOUNT_0 = '20000000000000000000';
    const BNB_AMOUNT_1 = '30000000000000000000';
    const USDC_AMOUNT = '100000000'
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const LINK_ADDRESS = '0xa36085F69e2889c224210F603D836748e7dC0088';
    const WETH_ADDRESS = '0xd0A1E359811322d97991E03f863a0C30C2cF029C';
    const SWAP_INPUT = '100000000000000000000';
    const LINK_TRANSFER_AMOUNT = '4000000000000000000';
    const ORACLE_ADDRESS = '0x1C05B0B2479E87C9c2A219d149Cee66beb379c47';
    const JOB_ID = '6614bb84bac74f7a9e20c644d1aededa';
    const TEST_JOB_ID = '10c200ed64324d71adfc6d7073e32dc8';

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

    // swap from ETH for LINK (USDC)

    const link = await ERC20.attach(
        LINK_ADDRESS
    );

    const router = await Router.attach(
        UNIV2_ROUTER_ADDRESS
    );

    const SWAP_PATH = [
        WETH_ADDRESS,
        LINK_ADDRESS
    ];

    const swapTx = await router.swapExactETHForTokens(
        0,
        SWAP_PATH,
        account,
        SAFE_DEADLINE,
        { value: SWAP_INPUT }
    );
    const swapTxReceipt = await swapTx.wait();
    console.log("\nRouter swapExactETHForTokens Transaction Receipt\n");

    const linkBalance = await link.balanceOf(account);
    console.log("LINK balance: " + linkBalance);

    const linkDecimals = await link.decimals();
    console.log("LINK decimals: " + linkDecimals);

    // deploy testnet consumer
    const ATestnetConsumer = await ethers.getContractFactory("ATestnetConsumer");
    const testNetConsumer = await ATestnetConsumer.deploy();
    console.log("testNetConsumer deployed to:", testNetConsumer.address);

    // transfer link
    const transferTx = await link.transfer(
        testNetConsumer.address,
        LINK_TRANSFER_AMOUNT
    );

    // test requestEthereumPrice
    const testRequestTx = await testNetConsumer.requestEthereumPrice(
        ORACLE_ADDRESS,
        JOB_ID
    );

    // TestRequest
    // =================================================================================================================

    // deploy testnet consumer
    const TestRequest = await ethers.getContractFactory("TestRequest");
    const testRequest = await TestRequest.deploy();
    console.log("testRequest deployed to:", testRequest.address);

    // transfer link
    const transferTx2 = await link.transfer(
        testRequest.address,
        LINK_TRANSFER_AMOUNT
    );

    // test requestEthereumPrice
    const testRequestTx2 = await testRequest.testRequest(
        ORACLE_ADDRESS,
        TEST_JOB_ID
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });