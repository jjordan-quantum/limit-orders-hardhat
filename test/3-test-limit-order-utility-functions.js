const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers')
const { waffleChai } = require("@ethereum-waffle/chai");
use(waffleChai);
require('dotenv').config();


// CONSTANTS

const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const BUSD_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // STABLE TOKEN
const USDC_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";  // PAYMENT TOKEN
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDCWBNB_ADDRESS = "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b"
const BUSDUSDC_ADDRESS = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"  // token0: BUSD, token1: USDC
const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const ROUTER_ADDRESS_V1 = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F";
const SELECTOR = 100;
const SAFE_DEADLINE = Math.round((new Date()).getTime() / 1000) + 590000;
const BNB_AMOUNT = '10000000000000000000';
const BNB_AMOUNT_0 = '20000000000000000000';
const BNB_AMOUNT_1 = '30000000000000000000';
const USDC_AMOUNT = '100000000'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const SAFE_GAS_FEES = '7500000000000000'
const BUSD_USDC = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"

// SET PAYMENT TOKEN HERE:
const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN;

const setup = async () => {

    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const ERC20 = await ethers.getContractFactory("ERC20");
    const Pair = await ethers.getContractFactory("UniswapV2Pair");
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const WETH = await ethers.getContractFactory("WETH");

    const router = await Router.attach(
        ROUTER_ADDRESS // pancakeswap router
    );

    const SWAP_PATH = [
        WBNB_ADDRESS,
        PAYMENT_TOKEN
    ];

    const swapTx = await router.swapExactETHForTokens(
        0,
        SWAP_PATH,
        account,
        SAFE_DEADLINE,
        { value: BNB_AMOUNT }
    );
    const swapTxReceipt = await swapTx.wait();

    const LimitOrders = await ethers.getContractFactory("LimitOrders");
    const limitOrders = await LimitOrders.deploy();
    await limitOrders.deployed();

    return {
        limitOrders
    }
}


describe("LimitOrders", function () {
    let limitOrders;

    before(async () => {
        return ({ limitOrders } = await setup());
    })

    describe('Utility functions', async () => {

        it('Test - create order - it should fail', async () => {
            await expect(limitOrders.createOrder(
                100,
                USDCWBNB_ADDRESS,
                BNB_AMOUNT,
                0,
                SAFE_DEADLINE,
                { value: BNB_AMOUNT }
            )).to.revertedWith('LIMITORDERS: CONTRACT MUST BE SET');
        });


        //==============================================================================================================
        // TEST - check checkPaymentTokenBalanceForUser (should fail - payment token not set)
        //==============================================================================================================

        // test passed...changed function visibility to internal
        /*
        it('Test - check checkPaymentTokenBalanceForUser - it should revert because router is not set', async () => {
            await expect(limitOrders.checkPaymentTokenBalanceForUser(account)).to.reverted;
        });
         */

        //==============================================================================================================
        // TEST - set SwapRouter
        //==============================================================================================================

        it('Test - setSwapRouter - it should not revert', async () => {
            await expect(limitOrders.setSwapRouter(ZERO_ADDRESS)).not.to.be.reverted;
        });

        //==============================================================================================================
        // TEST - set routerAddress
        //==============================================================================================================

        it('Test - set routerAddress - it should not revert', async () => {
            // set router
            await expect(limitOrders.setRouter(ROUTER_ADDRESS)).not.to.be.reverted;
            // check router
            const routerAddress = await limitOrders.routerAddress();
            expect(routerAddress).to.eql(ROUTER_ADDRESS);
            // check routerSet
            const routerSet = await limitOrders.routerSet();
            expect(routerSet).to.eql(true);
            // check wethAddress
            const wethAddress = await limitOrders.wethAddress();
            expect(wethAddress).to.eql(WBNB_ADDRESS);
        });

        //==============================================================================================================
        // TEST - set paymentToken
        //==============================================================================================================

        it('Test - set paymentToken - it should not revert', async () => {
            // set payment token
            await expect(limitOrders.setPaymentToken(PAYMENT_TOKEN)).not.to.be.reverted;
            // check payment token
            const paymentToken = await limitOrders.paymentToken();
            expect(paymentToken).to.eql(PAYMENT_TOKEN);
            // check payment token set
            const paymentTokenSet = await limitOrders.paymentTokenSet();
            expect(paymentTokenSet).to.eql(true);
        });

        //==============================================================================================================
        // TEST - set stableToken
        //==============================================================================================================

        it('Test - set stableToken - it should not revert', async () => {
            // set stable token
            await expect(limitOrders.setStableToken(BUSD_ADDRESS)).not.to.be.reverted;
            // check stable token
            const stableToken = await limitOrders.stableToken();
            expect(stableToken).to.eql(BUSD_ADDRESS);
            // check stable token set
            const stableTokenSet = await limitOrders.stableTokenSet();
            expect(stableTokenSet).to.eql(true);
        });

        //==============================================================================================================
        // TEST - set paymentRouter
        //==============================================================================================================

        it('Test - set paymentRouter - it should not revert', async () => {
            // set router
            await expect(limitOrders.setPaymentRouter(ROUTER_ADDRESS_V1)).not.to.be.reverted;
            // check router
            const paymentsRouterAddress = await limitOrders.paymentsRouterAddress();
            expect(paymentsRouterAddress).to.eql(ROUTER_ADDRESS_V1);
            // check routerSet
            const paymentsRouterSet = await limitOrders.paymentsRouterSet();
            expect(paymentsRouterSet).to.eql(true);
            // check wethAddress
            const wethAddress = await limitOrders.wethAddress();
            expect(wethAddress).to.eql(WBNB_ADDRESS);
        });

        //==============================================================================================================
        // TEST - check contractSet
        //==============================================================================================================

        it('Test - check contractSet - it should be true', async () => {
            const contractSet = await limitOrders.contractSet();
            expect(contractSet).to.eql(true);
        });

        //==============================================================================================================
        // TEST - check checkPaymentTokenBalanceForUser - should be zero
        //==============================================================================================================

        // test passed...changed function visibility to internal
        /*
        it('Test - check contractSet - it should be true', async () => {
            const paymentTokenBalance = await limitOrders.checkPaymentTokenBalanceForUser(account);
            expect(paymentTokenBalance > BigNumber.from(0)).to.eql(true);
        });
         */

        //==============================================================================================================
        // TEST - check isInputTokenWETH - with non-weth pair
        //==============================================================================================================

        it('Test - check isInputTokenWETH - it should be false', async () => {
            const selector = 161;
            const pair = BUSD_USDC;
            const isInputTokenWETH = await limitOrders.isInputTokenWETH(selector, pair);
            expect(isInputTokenWETH).to.eql(false);
        });

        //==============================================================================================================
        // TEST - check isInputTokenWETH - with weth pair -> should be false
        //==============================================================================================================

        it('Test - check isInputTokenWETH - it should be false', async () => {
            const selector = 101;
            const pair = USDCWBNB_ADDRESS;
            const isInputTokenWETH = await limitOrders.isInputTokenWETH(selector, pair);
            expect(isInputTokenWETH).to.eql(false);
        });

        //==============================================================================================================
        // TEST - check isInputTokenWETH - with weth pair -> should be true
        //==============================================================================================================

        it('Test - check isInputTokenWETH - it should be true', async () => {
            const selector = 100;
            const pair = USDCWBNB_ADDRESS;
            const isInputTokenWETH = await limitOrders.isInputTokenWETH(selector, pair);
            expect(isInputTokenWETH).to.eql(true);
        });

        //==============================================================================================================
        // TEST - check getInputToken
        //==============================================================================================================

        it('Test - check getInputToken - it should be false', async () => {
            const selector = 100;
            const pair = USDCWBNB_ADDRESS;
            const inputToken = await limitOrders.getInputToken(selector, pair);
            expect(inputToken.toLowerCase()).to.eql(WBNB_ADDRESS.toLowerCase());
        });

        //==============================================================================================================
        // TEST - check getTokenPath
        //==============================================================================================================

        it('Test - check getTokenPath - it should be false', async () => {
            const selector = 100;
            const pair = USDCWBNB_ADDRESS;
            const path = await limitOrders.getTokenPath(selector, pair);
            //console.log(path);
            expect(path[0].toLowerCase()).to.eql(WBNB_ADDRESS.toLowerCase());
            expect(path[1].toLowerCase()).to.eql(USDC_ADDRESS.toLowerCase());
        });
    });
});
