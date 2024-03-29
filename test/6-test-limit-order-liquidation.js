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
const STABLE_TOKEN = process.env.STABLE_TOKEN;
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
const PAYMENT_TOKEN_ROUTER_ADDRESS = process.env.PAYMENT_TOKEN_ROUTER_ADDRESS;

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
    const paymentToken = await ERC20.attach(PAYMENT_TOKEN);

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

    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    const swapRouter = await SwapRouter.deploy();
    await swapRouter.deployed();

    const LimitOrders = await ethers.getContractFactory("LimitOrders");
    const limitOrders = await LimitOrders.deploy();
    await limitOrders.deployed();

    return {
        router,
        weth,
        usdc,
        paymentToken,
        swapRouter,
        limitOrders
    }
}


describe("LimitOrders", function () {
    let router, weth, usdc, paymentToken, swapRouter, limitOrders;

    before(async () => {
        return ({ router, weth, usdc, paymentToken, swapRouter, limitOrders } = await setup());
    })

    describe('Order liquidation', async () => {

        //==============================================================================================================
        //
        //  SET UP LIMITORDERS CONTRACT
        //
        //==============================================================================================================

        //==============================================================================================================
        // TEST - set SwapRouter
        //==============================================================================================================

        it('Test - setSwapRouter - it should not revert', async () => {
            await expect(limitOrders.setSwapRouter(swapRouter.address)).not.to.be.reverted;
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
            await expect(limitOrders.setPaymentRouter(PAYMENT_TOKEN_ROUTER_ADDRESS)).not.to.be.reverted;
            // check router
            const paymentsRouterAddress = await limitOrders.paymentsRouterAddress();
            expect(paymentsRouterAddress).to.eql(PAYMENT_TOKEN_ROUTER_ADDRESS);
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
        //
        //  SET UP SWAPROUTER CONTRACT
        //
        //==============================================================================================================

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
        // TEST - set limitOrders
        //==============================================================================================================

        it('Test - setLimitOrderContract - it should not revert', async () => {
            await expect(swapRouter.setLimitOrderContract(limitOrders.address)).not.to.be.reverted;
        });

        //==============================================================================================================
        // |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
        //==============================================================================================================
        //
        //  TEST ORDER CREATION AND LIQUIDATION
        //
        //==============================================================================================================
        // |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
        //==============================================================================================================

        //==============================================================================================================
        //
        //  TEST 1 - Swap ETH -> Token
        //
        //  swapExactETHForTokens
        //  WBNB -> USDC
        //  selector: 100
        //
        //==============================================================================================================

        //==============================================================================================================
        // TEST - create order
        //==============================================================================================================

        it('Test - create order - it should not revert', async () => {
            await expect(limitOrders.createOrder(
                100,
                USDCWBNB_ADDRESS,
                BNB_AMOUNT,
                0,
                SAFE_DEADLINE,
                { value: BNB_AMOUNT }
            )).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - approve input token
        //==============================================================================================================

        it('Test - approve input token - it should not revert', async () => {
            await expect(weth.approve(limitOrders.address, BNB_AMOUNT)).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - checkForLiquidation
        //==============================================================================================================

        it('Test - check checkForLiquidation - it should be true', async () => {
            const canBeLiquidated = await limitOrders.checkForLiquidation(account, 0);
            expect(canBeLiquidated).to.eql(true);
        });

        //==============================================================================================================
        // TEST - liquidate
        //==============================================================================================================

        it('Test - check liquidate - it should not revert', async () => {
            await expect(limitOrders.liquidate(account, 0)).to.not.reverted;
        });

        //==============================================================================================================
        //
        //  TEST 2 - Swap Token -> ETH
        //
        //  swapExactTokensForETH
        //  USDC -> WBNB
        //  selector: 121
        //
        //==============================================================================================================

        //==============================================================================================================
        // TEST - create order
        //==============================================================================================================

        it('Test - create order - it should not revert', async () => {

            const usdcBalance = await usdc.balanceOf(account);
            await expect(limitOrders.createOrder(
                121,
                USDCWBNB_ADDRESS,
                usdcBalance,
                0,
                SAFE_DEADLINE
            )).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - approve input token
        //==============================================================================================================

        it('Test - create order - it should not revert', async () => {
            const usdcBalance = await usdc.balanceOf(account);
            await expect(usdc.approve(limitOrders.address, usdcBalance)).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - checkForLiquidation
        //==============================================================================================================

        it('Test - check checkForLiquidation - it should be true', async () => {
            const canBeLiquidated = await limitOrders.checkForLiquidation(account, 1);
            expect(canBeLiquidated).to.eql(true);
        });

        //==============================================================================================================
        // TEST - liquidate
        //==============================================================================================================

        it('Test - check liquidate - it should not revert', async () => {
            await expect(limitOrders.liquidate(account, 1)).to.not.reverted;
        });

        //==============================================================================================================
        //
        //  TEST 3 - Swap Token -> Token
        //
        //  swapExactTokensForTokens
        //  USDC -> BUSD
        //  selector: 140
        //
        //==============================================================================================================

        //==============================================================================================================
        // TEST - create order
        //==============================================================================================================

        it('Test - create order - it should not revert', async () => {

            const SWAP_PATH = [
                WBNB_ADDRESS,
                PAYMENT_TOKEN
            ];
            await router.swapExactETHForTokens(
                0,
                SWAP_PATH,
                account,
                SAFE_DEADLINE,
                { value: BNB_AMOUNT }
            );
            const SWAP_PATH_INPUT_TOKEN = [
                WBNB_ADDRESS,
                USDC_ADDRESS
            ];
            await router.swapExactETHForTokens(
                0,
                SWAP_PATH_INPUT_TOKEN,
                account,
                SAFE_DEADLINE,
                { value: BNB_AMOUNT }
            );
            const usdcBalance = await usdc.balanceOf(account);
            await expect(limitOrders.createOrder(
                140,
                BUSDUSDC_ADDRESS,
                usdcBalance,
                0,
                SAFE_DEADLINE
            )).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - approve input token
        //==============================================================================================================

        it('Test - create order - it should not revert', async () => {
            const usdcBalance = await usdc.balanceOf(account);
            await expect(usdc.approve(limitOrders.address, usdcBalance)).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - checkForLiquidation
        //==============================================================================================================

        it('Test - check checkForLiquidation - it should be true', async () => {
            const canBeLiquidated = await limitOrders.checkForLiquidation(account, 2);
            expect(canBeLiquidated).to.eql(true);
        });

        //==============================================================================================================
        // TEST - liquidate
        //==============================================================================================================

        it('Test - check liquidate - it should not revert', async () => {
            await expect(limitOrders.liquidate(account, 2)).to.not.reverted;
        });
    });
});