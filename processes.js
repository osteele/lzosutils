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


// This is a function that returns the instance, not a constructor.
// All readers are called before any taker.
function MVar() {
    var value,
        readers = [],
        writers = [],
        takers = [];
    return {
        writer: function(writer) {
            value
                ? writers.push(writer)
                : writer(put);
            return this;
        },
        reader: function(reader) {
            value
                ? reader(value[0])
                : readers.push(reader);
            return this;
        },
        taker: function(taker) {
            if (!value)
                return takers.push(taker);
            var x = value[0];
            value = null;
            taker(value);
            value || runNextWriter();
            return this;
        },
        put: put,
        tryPut: function(x) {
            value ? false : (value = [x], true);
        },
        tryTake: function(x) {
            var was = value;
            value = null;
            return was;
        }
    }
    function put(x) {
        if (value)
            return writers.push(Function.K(x));
        value = [x];
        if (readers.length) {
            readers.each(function(fn){fn.call(null, x)});
            readers = [];
        }
        if (takers.length) {
            var taker = takers.shift();
            taker(x);
        }
        value || runNextWriter();
    }
    function runNextWriter() {
        if (!value && writers.length) {
            var writer = writers.shift();
            writer(put);
        }
    }
}