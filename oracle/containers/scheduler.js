// loaded in main app
exports.Scheduler = (function() {

    const { Channel } = require('./channel');
    const cron = require('node-cron');

    const _schedule_ = '* * * * * *'    // 1 second schedule

    const publishedTopics = [
        'performScheduledJob'
    ]

    const runSchedule = async () => {
        cron.schedule(_schedule_, async () => {
            //_________________
            // publish scheduled job
            //=========================================================
            Channel.publish('performScheduledJob', {});
            //=========================================================
            //
            //
            //________________
        });
    }

    (() => {
        runSchedule().then();
    })();

    return {}
})();