exports.Config = (function() {
    const fs = require("fs");
    let configData;
    try {
        configData = fs.readFileSync('./config.json');
    } catch(err) {
        configData = fs.readFileSync('../config.json');
    }

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

    return {
        getDatabaseConfig: getDatabaseConfigInternal,
        getWeb3Config: getWeb3ConfigInternal,
        getChainlinkConfig: getChainlinkConfigInternal,
        getLimitOrdersConfig: getLimitOrdersConfigInternal
    }
})()