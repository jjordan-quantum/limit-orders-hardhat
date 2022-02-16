// loaded in main app
exports.MemoryManagerContainer = (function() {

    const { Channel } = require('./channel');
    let usedHeapSize = 0;
    const start = Math.floor(Date.now() / 1000);
    let heapSizeAlerted = false;
    const ALERT_HEAP_SIZE = 399999999;
    const MAX_HEAP_SIZE = 999999999;
    const CHECK_MEMORY_INTERVAL_MINUTES = 5;

    const publishedTopics = [
        'memoryAlert'
    ]

    const checkMemoryUsage = () => {

        const memoryUsage = process.memoryUsage();
        const heapTotal = parseInt(memoryUsage.heapTotal);
        console.log({ heapUsed: ""+(parseInt(memoryUsage.heapUsed)/1000000).toFixed(2)+"MB", heapTotal: ""+(parseInt(heapTotal)/1000000).toFixed(2)+"MB" });

        const elapsed = Math.floor(Date.now() / 1000) - start;

        if(heapTotal > ALERT_HEAP_SIZE) {
            if(!heapSizeAlerted) {
                Channel.publish('memoryAlert', {
                    message: "MemoryManagementContainer: Warning heap size growth beyond alert level: " + heapTotal
                })
                console.log("MemoryManagementContainer: Warning heap size growth beyond alert level: " + heapTotal)
                heapSizeAlerted = true;
            }
        }

        if(heapTotal > MAX_HEAP_SIZE) {
            Channel.publish('memoryAlert', {
                message: "MemoryManagementContainer: Warning heap size growth beyond max level: " + heapTotal
            })
            console.log("MemoryManagementContainer: Heap growth substantial. Exiting....");
            process.exit(1);
        }
    }

    (async () => {
        while(true) {
            await new Promise((resolve, reject) => {
                setTimeout(() => { resolve() }, CHECK_MEMORY_INTERVAL_MINUTES * 60 * 1000);
            });
            checkMemoryUsage();
        }
    })();

    return {}
})();