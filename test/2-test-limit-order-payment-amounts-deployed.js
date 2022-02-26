const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers')
const { waffleChai } = require("@ethereum-waffle/chai");
use(waffleChai);
require('dotenv').config();


// CONSTANTS

const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const BUSD_ADDRESS = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // STABLE TOKEN
const USDC_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";  // PAYMENT TOKEN
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const USDCWBNB_ADDRESS = "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b";
const BUSDUSDC_ADDRESS = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c";  // token0: BUSD, token1: USDC
const SELECTOR = 100;
const SAFE_DEADLINE = Math.round((new Date()).getTime() / 1000) + 590000;
const BNB_AMOUNT = '10000000000000000000';
const BNB_AMOUNT_0 = '20000000000000000000';
const BNB_AMOUNT_1 = '30000000000000000000';
const USDC_AMOUNT = '100000000'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const SAFE_GAS_FEES = '7500000000000000'

// SET PAYMENT TOKEN HERE:
const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN;
const STABLE_TOKEN = process.env.STABLE_TOKEN;
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
const PAYMENT_TOKEN_ROUTER_ADDRESS = process.env.PAYMENT_TOKEN_ROUTER_ADDRESS;
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS;
const LIMIT_ORDERS_ADDRESS = process.env.LIMIT_ORDERS_ADDRESS;
const SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;

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

    /*
    const swapTx = await router.swapExactETHForTokens(
        0,
        SWAP_PATH,
        account,
        SAFE_DEADLINE,
        { value: BNB_AMOUNT }
    );
    const swapTxReceipt = await swapTx.wait();

     */

    const LimitOrders = await ethers.getContractFactory("LimitOrders");
    const limitOrders = await LimitOrders.attach(
        LIMIT_ORDERS_ADDRESS
    );

    return {
        limitOrders
    }
}


describe("LimitOrders", function () {
    let limitOrders;

    before(async () => {
        return ({ limitOrders } = await setup());
    })

    describe('Payment amounts', async () => {


        //==============================================================================================================
        // TEST - check getProtocolFeePaymentAmount
        //==============================================================================================================

        it('Test - check getProtocolFeePaymentAmount - it should be greater than 0', async () => {
            const paymentAmount = await limitOrders.getProtocolFeePaymentAmount();
            console.log('getProtocolFeePaymentAmount: ', paymentAmount);
            expect(paymentAmount.toString()).to.not.eql('0');
        });

        //==============================================================================================================
        // TEST - check getPaymentTokenAmount
        //==============================================================================================================

        it('Test - check getPaymentTokenAmount - it should be greater than 0', async () => {
            const paymentAmount = await limitOrders.getPaymentTokenAmount(SAFE_GAS_FEES);
            console.log('getPaymentTokenAmount: ', paymentAmount);
            expect(paymentAmount.toString()).to.not.eql('0');
        });

        //==============================================================================================================
        // TEST - check getPaymentAmount
        //==============================================================================================================

        it('Test - check getPaymentAmount - it should be greater than 0', async () => {
            const paymentAmount = await limitOrders.getPaymentAmount(SAFE_GAS_FEES);
            console.log('paymentAmount: ', paymentAmount);
            expect(paymentAmount.toString()).to.not.eql('0');
        });

        //==============================================================================================================
        // TEST - check getPaymentAmount
        //==============================================================================================================

        it('Test - check getPaymentAmount - it should be greater than 0', async () => {
            const paymentAmount = await limitOrders.getPaymentAmount(SAFE_GAS_FEES);
            console.log('paymentAmount: ', paymentAmount);
            expect(paymentAmount.toString()).to.not.eql('0');
        });
    });
});
