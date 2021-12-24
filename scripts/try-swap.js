async function main() {

    // CONSTANTS

    const abiDecoder = require('abi-decoder');
    const txUtils = require('./tx-utils');
    const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const SWAP_TX_VALUE = "100000000000000000000";   // 100 ETH
    const SAFE_DEADLINE = 2639698709;

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

    // UPDATE THESE WITH DEPLOYED ADDRESSES
    //==================================================================================================================

    const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";  // PancakeRouterV2 on MSC mainnet
    const usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"    // USDC address on BSC mainnet

    //==================================================================================================================

    // get deployed router contract instance

    const router = await Router.attach(
        routerAddress // The deployed contract address
    );

    // test router functions

    const wethAddress = await router.WETH();
    const factoryAddress = await router.factory();

    const SWAP_PATH = [
        wethAddress,
        usdcAddress
    ]

    console.log()
    console.log("WETH address " + wethAddress);
    console.log("Factory address " + factoryAddress);
    console.log()

    // swap transaction

    const swapTx = await router.swapExactETHForTokens(
        0,
        SWAP_PATH,
        account,
        SAFE_DEADLINE,
        { value: SWAP_TX_VALUE }
    );
    const swapTxReceipt = await swapTx.wait();
    console.log("\nRouter swapExactETHForTokens Transaction Receipt\n")
    txUtils.printReceipt(swapTxReceipt, abiDecoder);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
