const run = require('./jake/run.jake').run;
const docker = require('./jake/docker.jake');
const redis = require('./jake/redis.jake');

/*
 * List all tools & options.
 */
const help = () => {
    return run('jake -f Jakefile -T');
}

desc("List all tools & options.");
task('default', help);
task('help', help);
