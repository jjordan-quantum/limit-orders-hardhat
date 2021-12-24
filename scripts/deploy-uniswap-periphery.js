async function main() {

    // CHANGE THIS
    const factoryAddress = "0x4D5D3FaE9b08a4FA2aEB9Bc0d86E3dB3b3126438";

    // deploy weth

    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    console.log("WETH deployed to:", weth.address);

    // deploy router

    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const router = await Router.deploy(
        factoryAddress,
        weth.address
    );
    console.log("Router deployed to:", router.address);



}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
