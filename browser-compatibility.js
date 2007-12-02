/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

/*
 * Debugger patches.
 *
 * Modify the debugger not to complain about
 * constructs that are ECMAScript and browser JavaScript's
 * accept.
 */

function $reportUndefinedVariable() {}

function $reportUndefinedProperty() {}


/*
 * String Methods
 */

// This is missing from ActionScript.
//
// +pattern+ is required to be a string; there's therefore no point in
// accepting a Function for +sub+.
String.prototype.replace = String.prototype.replace || function(pattern, sub) {
    var splits = this.split(pattern),
        segments = new Array(splits.length*2-1);
    for (var i = 0, dst = 0; i < splits.length; i++) {
        i && (segments[dst++] = sub);
        segments[dst++] = splits[i];
    }
    return segments.join('');
}


/*
 * Duck-type delegates as functions, and vice versa.
 */

// Coerce a function to a delegate.
LzDelegate.fromFunction = function(fn) {
    return new LzDelegate({execute:fn}, 'execute');
}

// Coerce a delegate to a function.
LzDelegate.prototype.toFunction = function() {
    var delegate = this;
    return function(data) {
        delegate.execute(data);
    }
}

// Coerce the argument from a function to a delegate.
// Return it unchanged if it's already a delegate.
LzDelegate.toDelegate = function(arg) {
    return arg instanceof Function
        ? LzDelegate.fromFunction(arg)
        : arg;
}

// Give LzDelegate the same call API as Function.  This
// allows code that takes a callback parameter to accept
// either functions or delegates for it.
LzDelegate.prototype.call = function(thisObject, data) {
    return this.execute(data);
}

// Give Function the same call API as a delegate.  This
// allows you to use functions for delegates.
Function.prototype.execute = function() {
    return this.apply(this, arguments);
}
