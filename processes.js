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

Function.prototype.throttled = function(interval, options) {
    interval = interval || 10;
    options = options || {};
    var fn = this,
        lastTime = null,
        backoffRatio = options.backoff == true ? 2 : options.backoff;
    return function() {
        var self = this,
            args = [].slice.call(arguments, 0);
        run.defer();
        function run() {
            var now = new Date,
                wait = interval - (now - lastTime);
            // false for wait==NaN
            if (wait > 0)
                return run.defer(wait);
            if (backoffRatio)
                interval = Math.ceil(interval * backoffRatio);
            lastTime = now;
            fn.apply(self, args);
            if (options.fromEnd)
                lastTime = new Date();
        }
    }
}

Function.throttled = function(fn, interval, options) {
    return fn.throttled(interval, options);
}

Function.maxtimes = function(count, fn, after) {
    return function() {
        if (--count < 0) {
            fn = after;
            after = undefined;
        }
        return fn && fn.apply(this, arguments);
    }
}
