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

Function.prototype.throttled = function(ms, options) {
    ms = ms || 10;
    options = options || {};
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
            if (options.backoff)
                ms *= 2;
            fn.apply(self, args);
            if (options.fromEnd)
                lastTime = new Date();
        }
    }
}

Function.throttled = function(fn, ms, options) {
    return fn.throttled(ms, options);
}

Function.maxtimes = function(count, fn) {
    return function() {
        if (--count < 0)
            return;
        fn.apply(this, arguments);
    }
}
