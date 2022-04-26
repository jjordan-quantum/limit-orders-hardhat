(async function() {
    require('newrelic');
    require('./containers/config');
    require('./containers/events-processor');
    require('./containers/external-initiator');
    require('./containers/external-adapter');
    require('./containers/limit-orders');
    require('./containers/memory-management');
    require('./containers/simulation');
    require('./containers/controller');
    require('./containers/scheduler');
})()
    .catch((err) => {
        require('./containers/logger').Logger.log(err);
    });