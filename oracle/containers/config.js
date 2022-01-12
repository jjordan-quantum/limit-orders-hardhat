// loaded by several containers
exports.Config = (function() {
    const fs = require("fs");
    let configData, limitOrdersABIData;
    try {
        configData = fs.readFileSync('./config.json');
    } catch(err) {
        configData = fs.readFileSync('../config.json');
    }
    try {
        limitOrdersABIData = fs.readFileSync('./artifacts/contracts/limit-order/LimitOrders.sol/LimitOrders.json');
    } catch(err) {
        try {
            limitOrdersABIData = fs.readFileSync('../artifacts/contracts/limit-order/LimitOrders.sol/LimitOrders.json');
        } catch(err) {
            limitOrdersABIData = fs.readFileSync('../../artifacts/contracts/limit-order/LimitOrders.sol/LimitOrders.json');
        }
    }
    const limitOrderABI = JSON.parse(limitOrdersABIData)['abi'];

    const config = JSON.parse(configData);

    const getDatabaseConfigInternal = () => {
        return JSON.parse(JSON.stringify(config.db));
    }

    const getWeb3ConfigInternal = () => {
        return JSON.parse(JSON.stringify(config.web3));
    }

    const getChainlinkConfigInternal = () => {
        return JSON.parse(JSON.stringify(config.chainlink));
    }

    const getLimitOrdersConfigInternal = () => {
        return JSON.parse(JSON.stringify(config.limit_orders));
    }

    const getLimitOrdersABIInternal = () => {
        return(limitOrderABI.slice());
    }

    const getHTTPSProviderInternal = () => {
        return config.web3.https_endpoint + config.web3.api_key + config.web3.https_suffix;
    }

    const getWebsocketProviderInternal = () => {
        return config.web3.websocket_endpoint + config.web3.api_key + config.web3.websocket_suffix;
    }

    const getLimitOrderContractAddressInternal = () => {
        return config.limit_orders.limit_orders_contract_address;
    }

    const getApprovedOracleAddressInternal = () => {
        return config.limit_orders.approved_oracle_address;
    }

    return {
        getDatabaseConfig: getDatabaseConfigInternal,
        getWeb3Config: getWeb3ConfigInternal,
        getChainlinkConfig: getChainlinkConfigInternal,
        getLimitOrdersConfig: getLimitOrdersConfigInternal,
        getLimitOrdersABI: getLimitOrdersABIInternal,
        getHTTPSProvider: getHTTPSProviderInternal,
        getWebsocketProvider: getWebsocketProviderInternal,
        getLimitOrderContractAddress: getLimitOrderContractAddressInternal,
        getApprovedOracleAddress: getApprovedOracleAddressInternal,
    }
})()