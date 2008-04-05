/* Copyright 2007 by Oliver Steele.  All rights reserved. */

Function.I = function(x) {return x};
Function.K = function(x) {return function(){return x}};

Function.prototype.bind = function(thisObject) {
    var fn = this,
        args = Array.slice(arguments, 1);
    return function() {
        return fn.apply(thisObject, args.concat([].slice.apply(arguments, 1)));
    }
}

Function.prototype.compose = function(other) {
    var fn = this,
        args = Array.slice(arguments, 1);
    return function() {
        var v = other.apply(this, arguments);
        return fn.call(this, v);
    }
}

Function.prototype.each = function(sequence, thisObject) {
    for (var i = 0; i < sequence.length; i++)
        this.call(thisObject, sequence[i]);
}

Function.prototype.map = function(sequence, thisObject) {
    var results = new Array(sequence.length);
    for (var i = 0; i < sequence.length; i++)
        results[i] = this.call(thisObject, sequence[i]);
}

Function.before = function(fn, wrapper) {
    return function() {
        wrapper.call(this);
        return fn.apply(this, arguments);
    }
}

Function.timed = function(fn) {
    return function() {
        if (Function.timed.running)
            return fn.apply(this, arguments);
        Function.timed.running = true;
        var startTime = (new Date).getTime(),
            result = fn.apply(this, arguments),
            duration = (new Date).getTime() - startTime;
        Function.timed.running = false;
        info('elapsed', duration/1000, 's');
        return result;
    }
}

function isInstanceOf(klass) {
    return function(object) {
        return object instanceof klass;
    }
}

// Returns a projection \x -> \x[name](args...)
function invoke(name, args) {
    args = Array.slice(args, 0);
    return function(object) {
        return object[name].apply(object, args.concat(Array.slice(arguments, 0)));
    }
}

// Returns a projection \x -> x[name]
function pluck(name) {
    return function(object) {
        return object[name];
    }
}
