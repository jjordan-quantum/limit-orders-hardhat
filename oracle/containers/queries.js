exports.Queries = (function() {
    // container for specific queries to updater db

    const { Postgres } = require('./postgres')

    const getAllActiveOrdersInternal = async () => {

        // get all active orders from updater db
    }

    return {
        getAllActiveOrders: getAllActiveOrdersInternal
    }
})();

