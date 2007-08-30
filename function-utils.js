/* Copyright 2007 by Oliver Steele.  All rights reserved. */

Function.I = function(x) {return x};
Function.K = function(x) {return function(){return x}};

Function.prototype.bind = function(thisObject) {
    var fn = this,
        args = [].slice.call(arguments, 1);
    return function() {
        return fn.apply(thisObject, args.concat([].slice.apply(arguments, 1)));
    }
}

Function.prototype.compose = function(other) {
    var fn = this,
        args = [].slice.call(arguments, 1);
    return function() {
        var v = other.apply(this, arguments);
        return fn.call(this, v);
    }
}

Function.prototype.delay = function(ms) {
    setTimeout(this, arguments.length ? ms : 10);
}

Function.prototype.defer = Function.prototype.delay;

function forEach(fn, ar, thisObject) {
    return ar.forEach(fn, thisObject);
}

function map(fn, ar, thisObject) {
    return ar.map(fn, thisObject);
}

function filter(fn, ar, thisObject) {
    return ar.filter(fn, thisObject);
}

var select = filter;

// Returns a projection this -> this[name]
function pluck(name) {
    return function() {
        return this[name];
    }
}

// Returns a projection this -> this[name](args...)
function invoke(name, args) {
    args = [].slice.call(args, 0);
    return function(object) {
        return object[name].apply(object, args.concat([].slice.call(arguments, 0)));
    }
}
