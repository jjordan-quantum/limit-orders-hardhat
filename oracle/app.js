(async function() {
    const TESTING = true;

    if(!TESTING) {
        //require('./containers/controller');
        require('./containers/external-initiator');
        require('./containers/scheduler');
        require('./containers/simulation');
    }
    require('./containers/external-adapter');
    require('./containers/memory-management');
})();