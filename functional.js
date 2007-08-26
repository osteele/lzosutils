/* Copyright 2007 by Oliver Steele.  All rights reserved. */

Function.I = function(x) {return x};
Function.K = function(x) {return function(){return x}};

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
