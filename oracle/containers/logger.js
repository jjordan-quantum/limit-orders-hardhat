exports.Logger = (function() {

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
        logRequest: logRequestInternal
    }
})();