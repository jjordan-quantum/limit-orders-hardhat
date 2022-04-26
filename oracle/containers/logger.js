exports.Logger = (function() {

    const util = require('util');

    const nrWinston = require('@newrelic/winston-enricher');
    const winston = require('winston');
    const logger = winston.createLogger({
        levels: {
            fatal: 0,
            error: 1,
            warn: 2,
            info: 3,
            trace: 4,
            debug: 5
        },
        level: 'info',
        format: nrWinston(),
        transports: [new winston.transports.Console()]
    });

    const inspectInternal = (message) => {
        //console.log(util.inspect(message, false, null, true));
        logger.info(JSON.stringify(util.inspect(message, false, null, true)));
    }

    const logInternal = (message) => {
        //console.log("" + new Date().toISOString() + " " + message);
        logger.info(message);
    }

    const logErrorInternal = (error) => {
        //console.log("" + new Date().toISOString() + " " + error);
        logger.info(error.toString());
    }

    const logRequestInternal = (request) => {
       // console.log("" + new Date().toISOString() + " " + request);
        logger.info(request);
    }

    return {
        log: logInternal,
        logError: logErrorInternal,
        logRequest: logRequestInternal,
        inspect: inspectInternal
    }
})();