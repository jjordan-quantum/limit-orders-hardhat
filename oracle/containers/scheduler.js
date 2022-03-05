// loaded in main app
exports.Scheduler = (function() {

    const { Channel } = require('./channel');
    const cron = require('node-cron');

    const { Logger } = require('./logger');
    const { Config } = require('./config');
    const settings = Config.getSettings();

    const jobIntervalMilliseconds = settings.job_interval_milliseconds;

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

    (async () => {
        //runSchedule().then();

        while(true) {

            await new Promise((resolve, reject) => {
               setTimeout(() => { resolve(); }, jobIntervalMilliseconds);
            });

            Logger.log('SCHEDULER: Performing scheduled job');
            Channel.publish('performScheduledJob', {});
        }
    })();

    return {}
})();