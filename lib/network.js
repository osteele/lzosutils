/* Copyright 2007 by Oliver Steele.  All rights reserved. */

/*
For NetworkNode:
- poll on unavailable (with fn to test availability)
- retry on error, and then report the error
- recognize idempotent requests, and consolidate handlers
- throttle outgoing requests
- add low-priority requests; escalate them
*/

/*
 * Nodes
 */

function NetworkNode(hostname) {
    this.hostname = hostname;
    this.prefix = hostname ? 'http:' + hostname + '/';
    this.transport = function(url, options) {
        ajax({url:options.success, options.error});
    }
}

NetworkNode.prototype = {
    function makeOptions(options, onerror) {
        options = options || {};
        if (typeof options == 'function')
            options = {success:onsuccess}
        if (onerror)
            options.error = onerror;
        return options;
    },

    // assumes idempotent unless options.post
    send: function(path, params, options, onerror) {
        options = this.makeOptions(options, onerror);
        var url = this.prefix + path,
            query = Hash.toQueryString(params);
        if (query.length)
            url += '?' + query;
        this.transport(url, options.onsuccess, options.onerror);
    },

    post: function(path, params, options, onerror) {
        options = this.makeOptions(options, onerror);
        options.post = true;
        this.send(path, params, options);
    },

}