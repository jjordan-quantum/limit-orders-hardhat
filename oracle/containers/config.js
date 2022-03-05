// loaded by several containers
exports.Config = (function() {
    const fs = require("fs");
    let configData, limitOrdersABIData;
    //console.log(__dirname);
    configData = fs.readFileSync(__dirname+'/../config.json');
    limitOrdersABIData = fs.readFileSync(__dirname+'/../../artifacts/contracts/limit-order/LimitOrders.sol/LimitOrders.json');

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

    const getSignerInternal = () => {
        return config.limit_orders.signer;
    }

    const getSignerAddressInternal = () => {
        return config.limit_orders.signer_address;
    }

    const getLimitOrderTopicsInternal = () => {
        return {
            createOrder: config.limit_orders.create_order_signature,
            updateOrder: config.limit_orders.update_order_signature,
            deleteOrder: config.limit_orders.delete_order_signature
        }
    }

    const getSettingsInternal = () => {
        return config.settings;
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
        getSigner: getSignerInternal,
        getSignerAddress: getSignerAddressInternal,
        getLimitOrderTopics: getLimitOrderTopicsInternal,
        getSettings: getSettingsInternal,
    }
})()