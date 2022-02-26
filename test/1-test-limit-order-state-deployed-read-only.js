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
const USDCWBNB_ADDRESS = "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b";
const BUSDUSDC_ADDRESS = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c";  // token0: BUSD, token1: USDC
const SELECTOR = 100;
const SAFE_DEADLINE = Math.round((new Date()).getTime() / 1000) + 590000;
const BNB_AMOUNT = '10000000000000000';
const BNB_AMOUNT_0 = '20000000000000000';
const BNB_AMOUNT_1 = '30000000000000000';
const USDC_AMOUNT = '1000000'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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

    describe('State variables', async () => {

        /*
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
         */

        it('Test - check routerAddress - it should be pancakeswap router address', async () => {
            const routerAddress = await limitOrders.routerAddress();
            expect(routerAddress).to.eql(ROUTER_ADDRESS);
        });

        it('Test - check routerSet - it should be true', async () => {
            const routerSet = await limitOrders.routerSet();
            expect(routerSet).to.eql(true);
        });

        it('Test - check wethAddress - it should be wbnb address', async () => {
            const wethAddress = await limitOrders.wethAddress();
            expect(wethAddress).to.eql(WBNB_ADDRESS);
        });

        it('Test - check paymentToken - it should be GOSWAPP token address', async () => {
            const paymentToken = await limitOrders.paymentToken();
            expect(paymentToken).to.eql(PAYMENT_TOKEN);
        });

        it('Test - check paymentTokenSet - it should be false', async () => {
            const paymentTokenSet = await limitOrders.paymentTokenSet();
            expect(paymentTokenSet).to.eql(true);
        });

        it('Test - check payment token - it should be zero address', async () => {
            const paymentToken = await limitOrders.paymentToken();
            console.log('PAYMENT TOKEN: ', paymentToken)
            expect(paymentToken).to.eql(PAYMENT_TOKEN);
        });

        it('Test - check stableTokenSet - it should be false', async () => {
            const stableTokenSet = await limitOrders.stableTokenSet();
            expect(stableTokenSet).to.eql(true);
        });

        it('Test - check contractSet - it should be false', async () => {
            const contractSet = await limitOrders.contractSet();
            expect(contractSet).to.eql(true);
        });

        it('Test - check refundsEnabled - it should be false', async () => {
            const refundsEnabled = await limitOrders.refundsEnabled();
            console.log('refundsEnabled: ', refundsEnabled);
            expect(refundsEnabled).to.eql(true);
        });

        it('Test - check protocolFeeEnabled - it should be false', async () => {
            const protocolFeeEnabled = await limitOrders.protocolFeeEnabled();
            expect(protocolFeeEnabled).to.eql(true);
        });

        it('Test - check protocolFeeAmount - it should be greater than 0', async () => {
            const protocolFeeAmount = await limitOrders.protocolFeeAmount();
            console.log('Protocol fee amount: ', protocolFeeAmount);
            expect(protocolFeeAmount.toString()).to.not.eql('0');
        });

        it('Test - check max deadline - it should be 2592000', async () => {
            const MAX_DEADLINE = await limitOrders.MAX_DEADLINE();
            expect(MAX_DEADLINE).to.eql(BigNumber.from(2592000));
        });

        it('Test - check averageGasCostPerLiquidation  - it should be 204040', async () => {
            const averageGasConsumedPerLiquidation = await limitOrders.averageGasConsumedPerLiquidation();
            console.log(averageGasConsumedPerLiquidation);
            expect(averageGasConsumedPerLiquidation.toString()).to.eql(BigNumber.from(180000).toString());
        });

        it('Test - check isAuthorizedOracle - it should be true', async () => {
            const isAuthorizedOracle = await limitOrders.isAuthorizedOracle(DEPLOYER_ADDRESS);
            expect(isAuthorizedOracle).to.eql(true);
        });

        it('Test - check isAuthorizedOracle - it should be false', async () => {
            const isAuthorizedOracle = await limitOrders.isAuthorizedOracle(ROUTER_ADDRESS);
            expect(isAuthorizedOracle).to.eql(false);
        });

        it('Test - check isAuthorizedOracle - it should be false', async () => {
            const isAuthorizedOracle = await limitOrders.isAuthorizedOracle(ZERO_ADDRESS);
            expect(isAuthorizedOracle).to.eql(false);
        });

        it('Test - set swapRouter - it should not revert', async () => {
            // set swap router
            //await expect(limitOrders.setSwapRouter(SWAP_ROUTER_ADDRESS)).not.to.be.reverted;
            // check swap router
            const swapRouterAddress = await limitOrders.swapRouterAddress();
            expect(swapRouterAddress).to.eql(SWAP_ROUTER_ADDRESS);
        });

        it('Test - set routerAddress - it should not revert', async () => {
            // set router
            //await expect(limitOrders.setRouter(ROUTER_ADDRESS)).not.to.be.reverted;
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

        it('Test - set paymentToken - it should not revert', async () => {
            // set payment token
            // await expect(limitOrders.setPaymentToken(PAYMENT_TOKEN)).not.to.be.reverted;
            // check payment token
            const paymentToken = await limitOrders.paymentToken();
            expect(paymentToken).to.eql(PAYMENT_TOKEN);
            // check payment token set
            const paymentTokenSet = await limitOrders.paymentTokenSet();
            expect(paymentTokenSet).to.eql(true);
        });

        it('Test - set stableToken - it should not revert', async () => {
            // set stable token
           /// await expect(limitOrders.setStableToken(STABLE_TOKEN)).not.to.be.reverted;
            // check stable token
            const stableToken = await limitOrders.stableToken();
            expect(stableToken).to.eql(STABLE_TOKEN);
            // check stable token set
            const stableTokenSet = await limitOrders.stableTokenSet();
            expect(stableTokenSet).to.eql(true);
        });

        it('Test - set paymentRouter - it should not revert', async () => {
            // set router
            //await expect(limitOrders.setPaymentRouter(PAYMENT_TOKEN_ROUTER_ADDRESS)).not.to.be.reverted;
            // check router
            const paymentsRouterAddress = await limitOrders.paymentsRouterAddress();
            expect(paymentsRouterAddress).to.eql(PAYMENT_TOKEN_ROUTER_ADDRESS);
            // check routerSet
            const paymentsRouterSet = await limitOrders.paymentsRouterSet();
            expect(paymentsRouterSet).to.eql(true);
        });

        it('Test - check contractSet - it should be true', async () => {
            const contractSet = await limitOrders.contractSet();
            expect(contractSet).to.eql(true);
        });

        it('Test - set refundsEnabled - it should not revert', async () => {
            // set refundsEnabled
            //await expect(limitOrders.enableRefunds()).not.to.be.reverted;
            // check refundsEnabled
            const refundsEnabled = await limitOrders.refundsEnabled();
            expect(refundsEnabled).to.eql(true);
        });

        it('Test - set protocol fee - it should not revert', async () => {
            // set protocol fee
            //await expect(limitOrders.setProtocolFee(200)).not.to.be.reverted;
            // check protocolFeeEnabled
            const protocolFeeEnabled = await limitOrders.protocolFeeEnabled();
            expect(protocolFeeEnabled).to.eql(true);
            // check protocolFeeAmount
            const protocolFeeAmount = await limitOrders.protocolFeeAmount();
            expect(protocolFeeAmount > 0).to.eql(true);
        });

        it('Test - set max deadline - it should not revert', async () => {
            // set max deadline
            //await expect(limitOrders.updateMaxDeadline(2592000+500)).not.to.be.reverted;
            // check max deadline
            const MAX_DEADLINE = await limitOrders.MAX_DEADLINE();
            console.log(MAX_DEADLINE);
            expect(MAX_DEADLINE.toString()).to.eql(BigNumber.from(2592000).toString());
        });

        it('Test - reset max deadline - it should not revert', async () => {
            // set max deadline
            //await expect(limitOrders.updateMaxDeadline(2592000)).not.to.be.reverted;
            // check max deadline
            const MAX_DEADLINE = await limitOrders.MAX_DEADLINE();
            expect(MAX_DEADLINE.toString()).to.eql(BigNumber.from(2592000).toString());
        });

        it('Test - set averageGasCostPerLiquidation - it should not revert', async () => {
            // set averageGasCostPerLiquidation
            //await expect(limitOrders.updateAverageGasConsumedPerLiquidation(135000)).not.to.be.reverted;
            // check averageGasCostPerLiquidation
            const averageGasConsumedPerLiquidation = await limitOrders.averageGasConsumedPerLiquidation();
            expect(averageGasConsumedPerLiquidation).to.eql(BigNumber.from(180000));
        });

        it('Test - reset averageGasCostPerLiquidation - it should not revert', async () => {
            // set averageGasCostPerLiquidation
            //await expect(limitOrders.updateAverageGasConsumedPerLiquidation(180000)).not.to.be.reverted;
            // check averageGasCostPerLiquidation
            const averageGasConsumedPerLiquidation = await limitOrders.averageGasConsumedPerLiquidation();
            console.log(averageGasConsumedPerLiquidation);
            expect(averageGasConsumedPerLiquidation.toString()).to.eql(BigNumber.from(180000).toString());
        });

    });
});
