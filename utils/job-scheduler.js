/**
 * A job scheduler to run periodic jobs.
 *
 * Author: James Pasko (james@adcrafted.com).
 *
 * @constructor
 */
function JobScheduler(interval) {
    // A queue of pending jobs is implemented using an array.
    this.queue = [];

    // The scheduling interval.
    this.interval = interval;
}

/**
 * Add a job to the queue.
 */
JobScheduler.prototype.add = function(job) {
    this.queue.push(job);
};

/**
 * Starts work on the jobs.
 */
JobScheduler.prototype.start = function() {
    if (this.queue.length > 0) {
	this.queue.shift().run();
    }
    setTimeout(this.start.bind(this), this.interval);
};

exports.JobScheduler = JobScheduler;
