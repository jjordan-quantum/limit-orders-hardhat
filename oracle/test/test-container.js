(async () => {
    await require('../containers/limit-orders').LimitOrders.runTest();
    await require('../containers/simulation').Simulation.runTest();
})()
    .then(() => {
        //process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });