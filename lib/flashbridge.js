/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

/*
 * JS Bridge
 */

var FlashBridge = {};

FlashBridge.initialize = function() {
    this.callbacks = {};
    this.nextSequenceNumber = 0;
    var ExternalInterface = flash.external.ExternalInterface;
    ExternalInterface.addCallback("handleFlashbridgeCallback",
                                  this, this.handleCallback);
    ExternalInterface.addCallback("handleFlashbridgeException",
                                  this, this.handleException);
}

FlashBridge.register = function(name, thisObject, fn) {
    if (!fn)
        return this.register(name, null, thisObject);
    flash.external.ExternalInterface.addCallback(name, thisObject, fn);
}

FlashBridge.call = function(fname) {
    var args = Array.slice(arguments, 1),
        callbacks = this.callbacks,
        sequenceNumber = this.nextSequenceNumber++,
        callbackRecord = null,
        modifier,
        expr = [
            'FlashBridge.handle("', fname, '",', sequenceNumber, ',',
            JSON.stringify(args), ')'
        ].join('');
    // don't use ExternalInterface to make the call, because of the bugs in
    // http://codinginparadise.org/weblog/2005/12/serious-bug-in-flash-8.html
    LzBrowser.exec(expr);
    return modifier = {
        onreturn: function(handler) {
            if (!callbackRecord)
                callbacks[sequenceNumber] = callbackRecord = {};
            callbackRecord.onreturn = handler;
            return modifier;
        },
        onexception: function(handler) {
            if (!callbackRecord)
                callbacks[sequenceNumber] = callbackRecord = {};
            callbackRecord.onexception = handler;
            return modifier;
        }
    }
}

FlashBridge.handleCallback = function(sequenceNumber, result) {
    var handlers = this.callbacks[sequenceNumber],
        onreturn = (handlers||{}).onreturn;
    delete this.callbacks[sequenceNumber];
    onreturn && onreturn(result)
}

FlashBridge.handleException = function(sequenceNumber, result) {
    var handlers = this.callbacks[sequenceNumber],
        onexception = (handlers||{}).onexception;
    delete this.callbacks[sequenceNumber];
    onexception && onexception(result)
}


/*
 * Utilities
 */

Array.slice = (function() {
    var slice = Array.prototype.slice;
    return function(array) {
        return slice.apply(array, slice.call(arguments, 1));
    }
})();

// Execute javascript in the browser.  Throttled to avoid race
// condition with MSIE.
LzBrowser.exec = function(expr) {
    var nextTime = arguments.callee.nextTime || 0,
        now = (new Date).getTime();
    if (now < nextTime)
        return setTimeout(function(){LzBrowser.exec(expr)},
                          nextTime - now);
    _root.getURL('javascript:'+expr);
    arguments.callee.nextTime = now + 100;
}


/*
 * Initialization
 */

FlashBridge.initialize();
