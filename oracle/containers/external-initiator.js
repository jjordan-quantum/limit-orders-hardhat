// @chainlink external initiator
exports.Initiator = (function() {

    const CHAINLINK_ACCESS_KEY = process.env.CHAINLINK_ACCESS_KEY;
    const CHAINLINK_ACCESS_SECRET = process.env.CHAINLINK_ACCESS_SECRET;
    const CHAINLINK_IP = process.env.CHAINLINK_IP;
    const LISTEN_PORT = process.env.PORT;
    const HTTPS_PROVIDER_ENDPOINT = process.env.HTTPS_PROVIDER_ENDPOINT;
    const WSS_PROVIDER_ENDPOINT = process.env.WSS_PROVIDER_ENDPOINT;
    const DB_USERNAME = process.env.DB_USERNAME;
    const DB_PASSWORD = process.env.DB_PASSWORD;
    const DB_HOST = process.env.DB_HOST;
    const DB_DATABASE = process.env.DB_DATABASE;
    const DB_PORT = process.env.DB_PORT;

    /** Function to call the chainlink node and run a job */
    function callChainlinkNode(job_id) {
        var url_addon = '/v2/specs/'+ job_id + '/runs'
        request.post({
            headers: {'content-type' : 'application/json', 'X-Chainlink-EA-AccessKey': CHAINLINK_ACCESS_KEY,
                'X-Chainlink-EA-Secret': CHAINLINK_ACCESS_SECRET},
            url:     CHAINLINK_IP+url_addon,
            body:    ""     // TODO - add fields for user / job# / contract
        }, function(error, response, body){
            // updateCurrentActiveJob()
        });
        console.log("Job Sent")
    }

    return {

    }
})();