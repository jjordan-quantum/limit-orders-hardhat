exports.SafeContainer = (function() {

    const _schedule_ = '* * * * * *'    // 1 second schedule
    const { Scheduler } = require('./scheduler')
    require('./controller')
    require('./external-adapter')
    require('./external-initiator')
    require('./limit-orders')

    Scheduler.startScheduler(_schedule_)

    return {
        // create order
        // update order
        // delete order
    }
})();