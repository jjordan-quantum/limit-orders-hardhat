// @chainlink external initiator
// loaded in main app
exports.Initiator = (function() {

    const { Channel } = require('./channel');
    const { Config } = require('./config');
    const { Logger } = require('./logger');
    const { LimitOrders } = require('./limit-orders');
    const chainlinkConfig = Config.getChainlinkConfig();
    const request = require("request");

    const CHAINLINK_ACCESS_KEY = chainlinkConfig.access_key;
    const CHAINLINK_ACCESS_SECRET = chainlinkConfig.access_secret;
    const CHAINLINK_IP = chainlinkConfig.ip_address;
    const JOBSPEC = chainlinkConfig.jobSped

    // =================================================================================================================
    //
    //  Subscription to topics published for sending requests to Chainlink node
    //
    // =================================================================================================================

    // create subscription for create request
    Channel.subscribe("sendChainlinkRequest", function(data) {
        Logger.log("EXTERNAL INITIATOR: Received sendChainlinkRequest topic");
        Logger.log(data);

        callChainlinkNode(JSON.parse(JSON.stringify(data)));
    });

    /** Function to call the chainlink node and run a job */
    function callChainlinkNode(data) {
        const jobId = data.jobId;   // jobId is for 'liquidation' job spec
        const requestBody = JSON.stringify(data.data);
        const urlAddon = '/v2/specs/'+ jobId + '/runs'
        request.post({
            headers: {'content-type' : 'application/json', 'X-Chainlink-EA-AccessKey': CHAINLINK_ACCESS_KEY,
                'X-Chainlink-EA-Secret': CHAINLINK_ACCESS_SECRET},
            url:     CHAINLINK_IP+urlAddon,
            body:    requestBody     // TODO - add fields for user / orderNum / contract to requestBody in data
        }, function(error, response, body){
            const message = {
                error: error,
                response: response,
                body: body,
                data: data
            }
            //_________________
            // publish message with response from sending request to chainlink node
            //=========================================================
            Channel.publish('chainlinkRequestSent', JSON.parse(JSON.stringify(message)));
            //=========================================================
            //
            //
            //________________
        });
        console.log("Job Sent to Chainlink node")
    }

    setTimeout(() => {
        console.log("Calling chainlink node....");
        const _data = LimitOrders.getLiquidationTransactionData(
            '0x883bBe40EA9DD69c20Ac9a6Db3e5842f762684d2',
            777
        );
        callChainlinkNode({
            jobId: JOBSPEC,
            data: {
                data: '0x883bBe40EA9DD69c20Ac9a6Db3e5842f762684d2',
                orderNum: 777,
                txData: '0x'+ _data.slice(10, _data.length)
            }});
    }, 5000);

    return {

    }
})();