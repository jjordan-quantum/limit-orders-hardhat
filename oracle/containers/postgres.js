exports.Postgres = (function() {
    const { Channel } = require('./channel');
    const { Config } = require('./config');
    const { Pool, Client } = require("pg");
    const OPTIONS = Config.getDatabaseConfig();
    const pool = new Pool(OPTIONS);
    const poolQueryInternal = async (_query_, _values_) => {
        return new Promise((resolve, reject) => {
            pool.connect((err, client, release) => {
                if (err) {
                    console.log('Error acquiring client')
                    console.log(err)
                    resolve([]);
                }
                client.query(_query_, _values_, (err, result) => {
                    release()
                    if(err) {
                        if(err && err.hasOwnProperty('message') && err.message.includes('unique constraint')) {
                            err = null;
                        }
                        if(err) {
                            console.log('Error making query: ', _query_)
                            console.log(err)
                            resolve([])
                        }
                    }
                    if(result && result.hasOwnProperty('rows')) {
                        resolve(result.rows.slice());
                    } else {
                        console.log("No rows in result for query: " + _query_);
                        resolve([]);
                    }
                })
            })
        })
    }

    return {
        poolQuery: poolQueryInternal
    }
})()