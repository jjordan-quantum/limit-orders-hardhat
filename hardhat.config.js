require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [
        //process.env.DEPLOYER
      ]
    },
    bsc: {
      url: 'https://bsc-dataseed1.defibit.io/',
      //accounts: [
        //process.env.DEPLOYER
      //]
    },
    hardhat: {
      forking: {
        url: process.env.PROVIDER_LIVE,
        accounts: [
          process.env.DEPLOYER
        ]
      }
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.6.6",
      },
      {
        version: "0.6.12",
      },
      {
        version: "0.8.4",
      },
      {
        version: "0.7.6",
        settings: {},
      },
      {
        version: "0.8.7",
      }
    ]
  },
};

// moralis endpoint: "https://speedy-nodes-nyc.moralis.io/0dfb3a0716615332cec38c23/bsc/mainnet/archive"
