exports.Scheduler = (function() {

    const { Channel } = require('./channel');
    const cron = require('node-cron');

    const publishedTopics = [
        'performScheduledJob'
    ]

    const runSchedule = async (_schedule_) => {
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

    const startSchedulerInternal = (schedule) => {

        runSchedule(schedule).then();
    }

    const stopSchedulerInternal = () => {
        // TODO
    }

    const updateScheduleInternal = (schedule) => {
        // TODO
    }

    return {
        getID: () => { return GlobalChannel.getIdentifier(); },
        getPublishedTopics: () => { return publishedTopics; },
        getSubscribedTopics: () => { return subscribedTopics; },
        startScheduler: (schedule) => { startSchedulerInternal(schedule); },
        stopScheduler: () => { stopSchedulerInternal(); },
        updateSchedule: (newSchedule) => { updateScheduleInternal(newSchedule); }
    }
})();