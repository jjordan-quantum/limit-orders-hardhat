# PancakeSwap Limit Orders

This project is for the development of a smart contract system used to create, manage and liquidate limit orders on PancakeSwap.
Deployment for testing should follow these steps:

Start by cloning the repo:
```
git clone https://github.com/jjordan-quantum/limit-orders-hardhat.git
```

From within the project's base directory:


Install dependencies
```
npm install
```

Compile the contracts
```
npx hardhat compile
```

Fork BSC mainnet to local hardhat network
```
npx hardhat node --fork https://your_archive_node_endpoint
```

Now, start a new terminal session for the following commands:

Compile contracts
```
npx hardhat compile
```

Run Limit Order deployment test scripts, which will deploy and test the contracts in the local fork of BSC
```
npx hardhat run --network localhost scripts/1-test-limit-order-state-vars.js
npx hardhat run --network localhost scripts/2-test-limit-order-payment-amounts.js
npx hardhat run --network localhost scripts/3-test-utility-functions.js
npx hardhat run --network localhost scripts/4-test-order-management.js
npx hardhat run --network localhost scripts/5-test-swaprouter.js
npx hardhat run --network localhost scripts/6-test-order-liquidation.js
npx hardhat run --network localhost scripts/7-test-orders-with-refunds-enabled.js
```
