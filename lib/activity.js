'use strict';

var debug = require('debug')('spt:pulse'),
    Events = require('./events'),
    Utils = require('./utils'),
    User = require('./user'),
    transport = require('./transport/browser');

/**
 * Activity constructor
 *
 * @class
 * @param {object} opts Options
 */
function Activity(opts) {
    if (!opts.clientId) {
        throw new Error('clientId is required');
    }

    if (!opts.pageId) {
        throw new Error('pageId is required');
    }
    if (!opts.activityType) {
        throw new Error('activityType is required');
    }

    if (opts.url) {
        this.url = opts.url;
    } else {
        this.url = 'http://TODO';
    }

    if (opts.transport) {
        this.transport = opts.transport;
    } else {
        this.transport = transport;
    }

    this.clientId = opts.clientId;
    this.pageId = opts.pageId;
    this.pageType = opts.pageType || 'page';
    this.verb = opts.activityType;

    this.queue = [];

    this.events = new Events(this);
    this.user = new User();
}

/**
 * Add object to queue
 *
 * @param {object} object
 */
Activity.prototype.addToQueue = function(object) {
    this.queue.push(object);
};

/**
 * Send objects in queue
 *
 * @param {function} callback
 */
Activity.prototype.sendQueue = function(callback) {
    if (!callback) {
        callback = function() {};
    }

    if (!this.queue.length) {
        return callback();
    }

    debug('Sending queue', this.queue);

    var queue = this.queue.slice(0);

    this.queue = [];

    var activity = this;

    this.transport(this.url, queue, function(err) {
        if (err) {
            debug('Failed to send queue');

            // Add failed items back into queue
            activity.queue = activity.queue.concat(queue);

            callback(err);
        } else {
            callback();
        }
    });
};

/**
 * Send item. If it fails add it to the queue
 *
 * @param {object} object
 * @param {function} callback
 */
Activity.prototype.send = function(object, callback) {
    debug('Sending item', object);

    if (!callback) {
        callback = function() {};
    }

    var activity = this;

    this.transport(this.url, [object], function(err) {
        if (err) {
            debug('Failed to send item');

            activity.addToQueue(object);

            callback(err);
        } else {
            callback();
        }
    });
};

/**
 * Collect actor data and create actor object
 *
 * @returns actor object
 */
Activity.prototype.createActor = function () {
    var actor = {};

    actor['@type'] = 'Person';
    actor['@id'] = this.user.getUserId();
    actor['spt:userAgent'] = navigator.userAgent;
    actor['spt:screenSize'] = window.screen.width + 'x' + window.screen.height;
    actor['spt:viewportSize'] = Utils.getViewportDimensions();
    actor['spt:acceptLanguage'] = Utils.getDeviceLanguage();

    return actor;
};

/**
 * Collect provider data and create provider object
 *
 * @returns provider object
 */
Activity.prototype.createProvider = function () {
    var provider = {};

    provider['@type'] = 'Organization';
    provider['@id'] = 'urn:spid.no:' + this.siteId;
    provider.url = document.URL;

    return provider;
};

/**
 * Creates the scaffold for the activity object, including actor and provider
 *
 * @returns activity object
 */
Activity.prototype.createScaffold = function () {
    var scaffold = {};

    scaffold['@context'] = ['http://www.w3.org/ns/activitystreams', {spt:'http://spt.no'}];
    scaffold['@type'] = this.activityType;
    scaffold.published = Utils.getTimestamp();
    // scaffold.actor = this.createActor();
    scaffold.provider = this.createProvider();

    return scaffold;
};

module.exports = Activity;
