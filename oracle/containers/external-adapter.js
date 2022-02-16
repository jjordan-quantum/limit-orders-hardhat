// @chainlink external adapter
// loaded in main app
exports.Adapter = (function() {
    // server requests -> express app
    const express = require('express');
    const bodyParser = require("body-parser");
    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    const util = require('util');

    //Define some constants
    const LISTEN_PORT = 5134;

    // array for tracking Chainlink job IDs
    const job_ids = [];

    const { Channel } = require('./channel');
    const { Logger } = require('./logger');

    const createOrder = (data) => {
        //_________________
        // publish request
        //=========================================================
        Channel.publish('createOrder', JSON.parse(JSON.stringify(data)));
        //=========================================================
        //
        //
        //________________
    }

    const updateOrder = (data) => {
        //_________________
        // publish request
        //=========================================================
        Channel.publish('updateOrder', JSON.parse(JSON.stringify(data)));
        //=========================================================
        //
        //
        //________________
    }

    const deleteOrder = (data) => {
        //_________________
        // publish request
        //=========================================================
        Channel.publish('deleteOrder', JSON.parse(JSON.stringify(data)));
        //=========================================================
        //
        //
        //________________
    }


    //======================================================================================================================
    //
    //  ENDPOINTS REQUIRED BY CHAINLINK NODE
    //
    //======================================================================================================================


    /** Health check endpoint */
    app.get('/', function (req, res) {

        Logger.log("Received request for health check!");

        res.sendStatus(200);
    })


    /** Called by chainlink node when a job is created using this external initiator */
    app.post('/jobs', function (req, res) {

        Logger.log("Received post request for jobs!");

        //Recieves info from node about the job id
        job_ids.push(req.body.jobId) //save the job id
        res.sendStatus(200);
    })


    /** Called by chainlink node when running the job */
    app.get("/temp", function(req, res) {

        Logger.log("Received request for temp!");

        res.send({'temp': 42})
    });


    //======================================================================================================================
    //
    //  ENDPOINTS FOR REQUESTS FROM CHAINLINK NODE => 'EXTERNAL ADAPTOR'
    //
    //======================================================================================================================


    /** create_order
     *
     * Endpoint for request from Chainlink node to create order
     * note:    this endpoint is set up as a bridge in the Node Operator UI
     * */
    app.post("/create_order", async function(req, res) {

        Logger.log("Received post request for create_order with req body:");
        //Logger.log(req.body);
        console.log(util.inspect(req.body, false, null, true));

        // TODO
        // only turn on if these endpoints are enabled in bridges

        // create and start compute job
        //createOrder(JSON.parse(JSON.stringify(req.body.data)));

        // response
        res.sendStatus(200);
    });


    /** update_order
     *
     * Endpoint for request from Chainlink node to update order
     * note:    this endpoint is set up as a bridge in the Node Operator UI
     * */
    app.post("/update_order", async function(req, res) {

        Logger.log("Received post request for update_order with req body:");
        //Logger.log(req.body);
        console.log(util.inspect(req.body, false, null, true));

        // TODO
        // only turn on if these endpoints are enabled in bridges

        // create and start compute job
        //updateOrder(JSON.parse(JSON.stringify(req.body.data)));

        // response
        res.sendStatus(200);
    });


    /** delete_order
     *
     * Endpoint for request from Chainlink node to delete order
     * note:    this endpoint is set up as a bridge in the Node Operator UI
     * */
    app.post("/delete_order", async function(req, res) {

        Logger.log("Received post request for delete_order with req body:");
        //Logger.log(req.body);
        console.log(util.inspect(req.body, false, null, true));

        // TODO
        // only turn on if these endpoints are enabled in bridges

        // create and start compute job
        //deleteOrder(JSON.parse(JSON.stringify(req.body.data)));

        // response
        res.sendStatus(200);
    });

    /** test_endpoint
     *
     * Endpoint to test request from Chainlink node
     * note:    this endpoint is set up as a bridge in the Node Operator UI
     * */
    app.post("/test_endpoint",  function(req, res) {

        Logger.log("Received post request for test_endpoint with req body:");
        //Logger.log(req.body);
        console.log(util.inspect(req.body, false, null, true));

        if(req && req.body && req.body.data) {

            //_________________
            // publish request
            //=========================================================
            Channel.publish('newLimitOrderEvent', req.body.data);
            //=========================================================
            //
            //
            //________________
        }

        // create and start compute job
        //deleteOrder(JSON.parse(JSON.stringify(req.body.data)));

        // response
        res.status(200).send({ data: {} });
        //res.sendStatus(200);
    });


    //======================================================================================================================
    //
    //  START SERVER
    //
    //======================================================================================================================


    const server = app.listen(LISTEN_PORT, function () {
        const port = server.address().port;
        console.log("App now running on port", port);
    });

    return null;
})();