async function main() {
    // We get the contract to deploy
    const Token = await ethers.getContractFactory("ERC20");
    const token = await Token.deploy(
        "Test Token",
        "TEST",
        18,
        '1000000000000000000000000'
    );

    console.log("Token deployed to:", token.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
