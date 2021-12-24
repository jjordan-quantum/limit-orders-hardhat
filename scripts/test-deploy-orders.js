async function main() {

    // CONSTANTS

    const abiDecoder = require('abi-decoder');
    const txUtils = require('./tx-utils');
    const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // deploy Orders.sol

    const OrderManager = await ethers.getContractFactory("OrderManager");
    const orderManager = await OrderManager.deploy();
    console.log("Orders deployed to:", orderManager.address);

    const owner = await orderManager.owner();
    console.log("OrderManager owner: " + owner);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
