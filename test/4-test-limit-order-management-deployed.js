const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers')
const { waffleChai } = require("@ethereum-waffle/chai");
use(waffleChai);
const util = require('util');
require('dotenv').config();


// CONSTANTS

const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const BUSD_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // STABLE TOKEN
const USDC_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";  // PAYMENT TOKEN
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDCWBNB_ADDRESS = "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b";
const BUSDUSDC_ADDRESS = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"; // token0: BUSD, token1: USDC
const SELECTOR = 100;
const SAFE_DEADLINE = Math.round((new Date()).getTime() / 1000) + 590000;
const BNB_TO_SWAP_FOR_PAYMENT_TOKEN = '100000000000000000';
const BNB_AMOUNT = '10000000000000000';
const BNB_AMOUNT_0 = '20000000000000000';
const BNB_AMOUNT_1 = '30000000000000000';
const USDC_AMOUNT = '1000000'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const SAFE_GAS_FEES = '7500000000000000'
const BUSD_USDC = "0xEc6557348085Aa57C72514D67070dC863C0a5A8c"

// SET PAYMENT TOKEN HERE:
const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN;
const STABLE_TOKEN = process.env.STABLE_TOKEN;
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
const PAYMENT_TOKEN_ROUTER_ADDRESS = process.env.PAYMENT_TOKEN_ROUTER_ADDRESS;
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS;
const LIMIT_ORDERS_ADDRESS = process.env.LIMIT_ORDERS_ADDRESS;
const SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;

const hre = require('hardhat');
import hre from 'hardhat';


const setup = async () => {

    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const ERC20 = await ethers.getContractFactory("ERC20");
    const Pair = await ethers.getContractFactory("UniswapV2Pair");
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const WETH = await ethers.getContractFactory("WETH");

    Object.keys(hre).forEach((key) => {
       console.log(key);
       console.log('type: ', typeof(hre[key]));
       console.log(hre[key]);
       console.log();
    });

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
        DEPLOYER_ADDRESS,
        SAFE_DEADLINE,
        { value: BNB_TO_SWAP_FOR_PAYMENT_TOKEN }
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

    describe('Order Management', async () => {

        //==============================================================================================================
        // TEST - check contractSet
        //==============================================================================================================

        it('Test - check contractSet - it should be true', async () => {
            const contractSet = await limitOrders.contractSet();
            expect(contractSet).to.eql(true);
        });

        //==============================================================================================================
        // TEST - check create orders
        //==============================================================================================================

        for(let i = 0; i < 5; i++) {

            it('Test - create order number ' + i + ' - it should not fail', async () => {
                await expect(limitOrders.createOrder(
                    100,
                    USDCWBNB_ADDRESS,
                    BNB_AMOUNT,
                    0,
                    SAFE_DEADLINE,
                    { value: BNB_AMOUNT }
                )).to.not.reverted;
            });
        }

        //==============================================================================================================
        // TEST - check order count
        //==============================================================================================================

        it('Test - check getOrderCount - it should be 5', async () => {
            const orderCount = await limitOrders.getOrderCount();
            expect(orderCount).to.eql(BigNumber.from(5));
        });

        //==============================================================================================================
        // TEST - view order [0]
        //==============================================================================================================

        it('Test - check viewOrder - it should return an object', async () => {
            const order = await limitOrders.viewOrder(0);
            console.log(util.inspect(order, false, null, true));
            expect(typeof(order)).to.eql('object');
            expect(order.isOrderActive).to.eql(true);
        });

        //==============================================================================================================
        // TEST - view invalid
        //==============================================================================================================

        it('Test - check viewOrder - it should revert', async () => {
            await expect(limitOrders.viewOrder(99)).to.reverted;
        });

        //==============================================================================================================
        // TEST - update order [0]
        //==============================================================================================================

        it('Test - updateOrder - it should not revert', async () => {
            await expect(limitOrders.updateOrder(
                0,
                BNB_AMOUNT_0,
                10,
                SAFE_DEADLINE + 10000,
                { value: BNB_AMOUNT }
            )).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - view order [0] after update
        //==============================================================================================================

        it('Test - check viewOrder after update - it should return an object', async () => {
            const order = await limitOrders.viewOrder(0);
            console.log(util.inspect(order, false, null, true));
            expect(typeof(order)).to.eql('object');
            expect(order.inputAmount).to.eql(BigNumber.from(BNB_AMOUNT_0));
        });

        //==============================================================================================================
        // TEST - delete order
        //==============================================================================================================

        it('Test - check deleteOrder - it should not revert', async () => {
            await expect(limitOrders.deleteOrder(0)).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - check order count
        //==============================================================================================================

        it('Test - check getOrderCount - it should be 4', async () => {
            const orderCount = await limitOrders.getOrderCount();
            expect(orderCount).to.eql(BigNumber.from(4));
        });

        //==============================================================================================================
        // TEST - view order [0] after deleting
        //==============================================================================================================

        it('Test - check viewOrder - it should return an object', async () => {
            const order = await limitOrders.viewOrder(0);
            console.log(util.inspect(order, false, null, true));
            expect(typeof(order)).to.eql('object');
            expect(order.isOrderActive).to.eql(false);
        });

        //==============================================================================================================
        // TEST - delete order again
        //==============================================================================================================

        it('Test - check deleteOrder - it shouldot revert', async () => {
            await expect(limitOrders.deleteOrder(0)).to.revertedWith("ORDER MANAGER: ORDER NOT ACTIVE");
        });

        //==============================================================================================================
        // TEST - update order [1] deadline
        //==============================================================================================================

        it('Test - updateOrder - it should not revert', async () => {
            await expect(limitOrders.updateOrderDeadline(
                1,
                SAFE_DEADLINE + 10000
            )).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - view order [1] after update - deadline should be different
        //==============================================================================================================

        it('Test - check viewOrder - it should return an object', async () => {
            const order = await limitOrders.viewOrder(1);
            //console.log(util.inspect(order, false, null, true));
            expect(typeof(order)).to.eql('object');
            expect(order.deadline).to.eql(BigNumber.from(SAFE_DEADLINE + 10000));
        });

        //==============================================================================================================
        // TEST - update order [2] amounts
        //==============================================================================================================

        it('Test - updateOrder - it should not revert', async () => {
            await expect(limitOrders.updateOrderAmounts(
                2,
                BNB_AMOUNT_0,
                10,
                { value: BNB_AMOUNT }
            )).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - view order [2] after update - amounts should have changed
        //==============================================================================================================

        it('Test - check viewOrder - it should return an object', async () => {
            const order = await limitOrders.viewOrder(2);
            //console.log(util.inspect(order, false, null, true));
            expect(typeof(order)).to.eql('object');
            expect(order.inputAmount).to.eql(BigNumber.from(BNB_AMOUNT_0));
            expect(order.minOutputAmount).to.eql(BigNumber.from(10));
        });

        //==============================================================================================================
        // TEST - update order [3] minOutputAMount
        //==============================================================================================================

        it('Test - updateOrderMinOutputAmount - it should not revert', async () => {
            await expect(limitOrders.updateOrderMinOutputAmount(
                3,
                10
            )).to.not.reverted;
        });

        //==============================================================================================================
        // TEST - view order [3] after update - minOutputAmount should have changed
        //==============================================================================================================

        it('Test - check viewOrder - it should return an object', async () => {
            const order = await limitOrders.viewOrder(3);
            //console.log(util.inspect(order, false, null, true));
            expect(typeof(order)).to.eql('object');
            expect(order.minOutputAmount).to.eql(BigNumber.from(10));
        });
    });
});