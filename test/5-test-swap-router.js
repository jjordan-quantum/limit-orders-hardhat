const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers')
const { waffleChai } = require("@ethereum-waffle/chai");
use(waffleChai);
const util = require('util');


// CONSTANTS

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

const setup = async () => {

    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const ERC20 = await ethers.getContractFactory("ERC20");
    const Pair = await ethers.getContractFactory("UniswapV2Pair");
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const WETH = await ethers.getContractFactory("WETH");

    const router = await Router.attach(
        ROUTER_ADDRESS // pancakeswap router
    );

    const weth = await WETH.attach(
        WBNB_ADDRESS
    );

    const usdc = await ERC20.attach(USDC_ADDRESS);

    const SWAP_PATH = [
        WBNB_ADDRESS,
        USDC_ADDRESS
    ];

    const swapTx = await router.swapExactETHForTokens(
        0,
        SWAP_PATH,
        account,
        SAFE_DEADLINE,
        { value: BNB_AMOUNT }
    );
    const swapTxReceipt = await swapTx.wait();

    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    const swapRouter = await SwapRouter.deploy();
    console.log("SwapRouter deployed to:", swapRouter.address);

    return {
        router,
        weth,
        usdc,
        swapRouter
    }
}


describe("LimitOrders", function () {
    let router, weth, usdc, swapRouter;

    before(async () => {
        return ({ router, weth, usdc, swapRouter } = await setup());
    })

    describe('SwapRouter', async () => {


        //==============================================================================================================
        // TEST - set routerAddress
        //==============================================================================================================

        it('Test - set routerAddress - it should not revert', async () => {
            // set router
            await expect(swapRouter.setRouter(ROUTER_ADDRESS)).not.to.be.reverted;
            // check router
            const routerAddress = await swapRouter.routerAddress();
            expect(routerAddress).to.eql(ROUTER_ADDRESS);
        });

        //==============================================================================================================
        // TEST - check getInputToken
        //==============================================================================================================

        it('Test - check getInputToken - it should be false', async () => {
            const selector = 100;
            const pair = USDCWBNB_ADDRESS;
            const inputToken = await swapRouter.getInputToken(selector, pair);
            expect(inputToken.toLowerCase()).to.eql(WBNB_ADDRESS.toLowerCase());
        });

        //==============================================================================================================
        // TEST - check getTokenPath
        //==============================================================================================================

        it('Test - check getTokenPath - it should be false', async () => {
            const selector = 100;
            const pair = USDCWBNB_ADDRESS;
            const path = await swapRouter.getTokenPath(selector, pair);
            //console.log(path);
            expect(path[0].toLowerCase()).to.eql(WBNB_ADDRESS.toLowerCase());
            expect(path[1].toLowerCase()).to.eql(USDC_ADDRESS.toLowerCase());
        });

        //==============================================================================================================
        // TEST - set limitOrders
        //==============================================================================================================

        it('Test - setLimitOrderContract - it should not revert', async () => {
            await expect(swapRouter.setLimitOrderContract(account)).not.to.be.reverted;
        });

        //==============================================================================================================
        // TEST - swap - > swapExactETHForTokens (100, 101)
        //==============================================================================================================

        it('Test - swap - it should not revert', async () => {

            // deposit WETH
            await weth.deposit({ value: BNB_AMOUNT });

            // transfer tokens (WETH) to SwapRouter contract before swapping
            await weth.transfer(swapRouter.address, BNB_AMOUNT);

            // execute swap
            await expect(
                swapRouter.swap(
                    100,
                    USDCWBNB_ADDRESS,
                    BNB_AMOUNT,
                    0,
                    account,
                    SAFE_DEADLINE
                )
            ).not.to.be.reverted;
        });

        //==============================================================================================================
        // TEST - swap - > swapExactETHForTokensSupportingFeeOnTransferTokens (110, 111)
        //==============================================================================================================

        it('Test - swap - it should not revert', async () => {

            // deposit WETH
            await weth.deposit({ value: BNB_AMOUNT });

            // transfer tokens (WETH) to SwapRouter contract before swapping
            await weth.transfer(swapRouter.address, BNB_AMOUNT);

            // execute swap
            await expect(
                swapRouter.swap(
                    110,
                    USDCWBNB_ADDRESS,
                    BNB_AMOUNT,
                    0,
                    account,
                    SAFE_DEADLINE
                )
            ).not.to.be.reverted;
        });

        //==============================================================================================================
        // TEST - swap - > swapExactTokensForETH (120, 121)
        //==============================================================================================================

        it('Test - swap - it should not revert', async () => {

            // get balance of USDC
            const usdcBalance = await usdc.balanceOf(account);

            // transfer tokens (USDC) to SwapRouter contract before swapping
            await usdc.transfer(swapRouter.address, usdcBalance);

            // execute swap
            await expect(
                swapRouter.swap(
                    121,
                    USDCWBNB_ADDRESS,
                    usdcBalance,
                    0,
                    account,
                    SAFE_DEADLINE
                )
            ).not.to.be.reverted;
        });

        //==============================================================================================================
        // TEST - swap - > swapExactTokensForETHSupportingFeeOnTransferTokens (130, 131)
        //==============================================================================================================

        it('Test - swap - it should not revert', async () => {

            let SWAP_PATH = [
                WBNB_ADDRESS,
                USDC_ADDRESS
            ]

            await router.swapExactETHForTokens(
                0,
                SWAP_PATH,
                account,
                SAFE_DEADLINE,
                { value: BNB_AMOUNT }
            );

            // get balance of USDC
            const usdcBalance = await usdc.balanceOf(account);

            // transfer tokens (USDC) to SwapRouter contract before swapping
            await usdc.transfer(swapRouter.address, usdcBalance);

            // execute swap
            await expect(
                swapRouter.swap(
                    131,
                    USDCWBNB_ADDRESS,
                    usdcBalance,
                    0,
                    account,
                    SAFE_DEADLINE
                )
            ).not.to.be.reverted;
        });

        //==============================================================================================================
        // TEST - swap - > swapExactTokensForTokens (140, 141)
        //==============================================================================================================

        it('Test - swap - it should not revert', async () => {

            let SWAP_PATH = [
                WBNB_ADDRESS,
                USDC_ADDRESS
            ]

            await router.swapExactETHForTokens(
                0,
                SWAP_PATH,
                account,
                SAFE_DEADLINE,
                { value: BNB_AMOUNT }
            );

            // get balance of USDC
            const usdcBalance = await usdc.balanceOf(account);

            // transfer tokens (USDC) to SwapRouter contract before swapping
            await usdc.transfer(swapRouter.address, usdcBalance);

            // execute swap
            await expect(
                swapRouter.swap(
                    140,
                    BUSDUSDC_ADDRESS,
                    usdcBalance,
                    0,
                    account,
                    SAFE_DEADLINE
                )
            ).not.to.be.reverted;
        });

        //==============================================================================================================
        // TEST - swap - > swapExactTokensForTokensSupportingFeeOnTransferTokens (150, 151)
        //==============================================================================================================

        it('Test - swap - it should not revert', async () => {

            let SWAP_PATH = [
                WBNB_ADDRESS,
                USDC_ADDRESS
            ]

            await router.swapExactETHForTokens(
                0,
                SWAP_PATH,
                account,
                SAFE_DEADLINE,
                { value: BNB_AMOUNT }
            );

            // get balance of USDC
            const usdcBalance = await usdc.balanceOf(account);

            // transfer tokens (USDC) to SwapRouter contract before swapping
            await usdc.transfer(swapRouter.address, usdcBalance);

            // execute swap
            await expect(
                swapRouter.swap(
                    150,
                    BUSDUSDC_ADDRESS,
                    usdcBalance,
                    0,
                    account,
                    SAFE_DEADLINE
                )
            ).not.to.be.reverted;
        });
    });
});