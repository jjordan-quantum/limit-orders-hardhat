exports.Channel = (function() {
    let id = 0;
    const container = {}

    const subscribeInternal = function(topic, f) {
        if (!(topic in container)) {
            createTopic(topic);
        }
        container[topic].push({
            "id": ++id,
            "callback": f
        });
        return id;
    }

    const unsubscribeInternal = function(topic, id) {
        let subscribers = [];
        if(container.hasOwnProperty(topic)) {
            for (let subscriber of container[topic]) {
                if (subscriber.id !== id) {
                    subscribers.push(subscriber);
                }
            }
            container[topic] = subscribers;
        } else {
            console.log("Topic " + topic + " not found for unsubscribing ID " + id);
        }
    }

    const publishInternal = function(topic, data) {
        if(container.hasOwnProperty(topic)) {
            for (let subscriber of container[topic]) {
                subscriber.callback(data);
            }
        } else {
            createTopic(topic);
        }
    }

    const createTopic = (topic) => {
        if (topic in container) {
            return;
        }
        container[topic] = [];
    }

    const getTotalNumberOfSubscribersInternal = () => {
        let subscriberCount = 0;
        Object.values(container).forEach((subscribers) => {
            subscriberCount += subscribers.length;
        });
        return subscriberCount;
    }

    const getTotalNumberOfSubscribersForTopicInternal = (topic) => {
        if (!(topic in container)) {
            return 0;
        }
        return container[topic].length;
    }

    return {
        subscribe: subscribeInternal,
        unsubscribe: unsubscribeInternal,
        publish: publishInternal,
        getIdentifier: () => { return uniqueID; },
        getNumberOfTopics: () => { return Object.keys(container).length; },
        getTotalNumberOfSubscribers: getTotalNumberOfSubscribersInternal,
        getTotalNumberOfSubscribersForTopic: getTotalNumberOfSubscribersForTopicInternal
    }
})();