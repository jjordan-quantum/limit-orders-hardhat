exports.Logger = (function() {

    const util = require('util');

    const inspectInternal = (message) => {
        console.log(util.inspect(message, false, null, true));
    }

    const logInternal = (message) => {
        console.log("" + new Date().toISOString() + " " + message);
    }

    const logErrorInternal = (error) => {
        console.log("" + new Date().toISOString() + " " + error);
    }

    const logRequestInternal = (request) => {
        console.log("" + new Date().toISOString() + " " + request);
    }

    return {
        log: logInternal,
        logError: logErrorInternal,
        logRequest: logRequestInternal,
        inspect: inspectInternal
    }
})();