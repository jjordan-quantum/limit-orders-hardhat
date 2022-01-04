(function() {
    const _schedule_ = '* * * * * *'    // 1 second schedule
    const { Scheduler} = ('./containers/scheduler')
    require('./containers/server')
    require('./containers/controller')
    Scheduler.startScheduler(_schedule_)
})();