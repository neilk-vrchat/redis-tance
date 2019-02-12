'use strict';
/*
    RedisSet.js
 */
const incrementRedisId = (redisId) => {
    let [start, end] = redisId.split("-");
    return `${start}-${parseInt(end, 10)+1}`;
};

class RedisStream{

    constructor({tance, channel, streamLength}){
        if(tance == null){
            throw new DocumentValidationError("Can't create stream without a database");
        }
        if(channel == null){
            throw new DocumentValidationError("Can't create stream without a channel");
        }
        this.tance = tance;
        this.channel = channel;
        this.streamLength = streamLength;
    }

    async write(object){
        let args = [];
        Object.keys(object).forEach((key)=>{
            args.push(key);
            args.push(object[key].toString());
        });
        return this.tance.xadd(`channel-${this.channel}`, `MAXLEN`, `~`, this.streamLength, "*", ...args)
    }

    async readFn(){
        var highestIdWeHaveEverSeen = await this.tance.get(`channel-${this.channel}-highest`);
        return async ()=> {

            if(highestIdWeHaveEverSeen == null || highestIdWeHaveEverSeen === ""){
                highestIdWeHaveEverSeen = "0";  // \o_o/
            }

            let read = await this.tance.xrange(`channel-${this.channel}`, highestIdWeHaveEverSeen, "+");
            if(read != null){
                let returnVals = [];
                read.forEach(([higherId, zippedObject]) => {
                    highestIdWeHaveEverSeen = incrementRedisId(higherId);
                    let createdObj = {};
                    while(zippedObject.length > 0){
                        if(zippedObject.length == 1){
                            console.error("Something bad has happened; We've unchunked an unchunkable");
                        }
                        else{
                            let val = zippedObject.pop();
                            let key = zippedObject.pop();
                            createdObj[key] = val;
                        }
                    }
                    returnVals.push(createdObj);
                });
                return returnVals;
            }
            else{
                return [];
            }
        };
    }

}

module.exports = RedisStream;