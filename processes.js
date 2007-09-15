/* Copyright 2007 by Oliver Steele.  All rights reserved. */

/*
 * Timing
 */

Function.prototype.delay = function(ms) {
    setTimeout(this, ms || 10);
}

Function.prototype.defer = Function.prototype.delay;

Function.delay = Function.defer = function(fn, ms) {
    return fn.delay(ms);
}


/*
 * Throttling
 */

Function.prototype.throttled = function(ms, backoff) {
    ms = ms || 10;
    var fn = this,
        lastTime = null;
    return function() {
        var self = this,
            args = [].slice.call(arguments, 0);
        run();
        function run() {
            var wait = ms - (new Date() - lastTime);
            // false for wait==NaN
            if (wait > 0)
                return run.defer(wait);
            lastTime = new Date();
            if (backoff)
                ms *= 2;
            fn.apply(self, args);
        }
    }
}

Function.throttled = function(fn, ms, backoff) {
    return fn.throttled(ms, backoff);
}

Function.maxtimes = function(count, fn) {
    return function() {
        if (--count < 0)
            return;
        fn.apply(this, arguments);
    }
}


/*
 * Queueing
 */

Function.prototype.maxconcurrent = function(max) {
    Debug.warn('untested');
    var fn = this,
        count = 0,
        queue = [];
    wrapper.next = fn.done = function() {
        if (queue.length) {
            var entry = queue.shift();
            wrapper.apply(entry[0], entry[1]);
        }
    }
    function wrapper() {
        if (count > max)
            return queue.push([this, [].slice.call(arguments, 0)]);
        fn.apply(this, arguments);
    }
}