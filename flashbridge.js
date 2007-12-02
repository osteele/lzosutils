/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

/*
 * JS Bridge
 */

var FlashBridge = function() {
    this.callbacks = {};
    this.callbackId = 0;
    var ExternalInterface = flash.external.ExternalInterface;
    ExternalInterface.addCallback("handleFlashbridgeCallback",
                                  this, this.handleCallback);
    ExternalInterface.addCallback("handleFlashbridgeException",
                                  this, this.handleException);
}

FlashBridge.prototype.register = function(name, thisObject, fn) {
    if (!fn) {
        fn = thisObject;
        thisObject = null;
    }
    flash.external.ExternalInterface.addCallback(name, thisObject, fn);
}

FlashBridge.prototype.call = function(fname) {
    var args = Array.slice(arguments, 1),
        callbacks = this.callbacks,
        callbackId = ++this.callbackId,
        callbackRecord = null,
        modifier,
        expr = ['javascript:FlashBridge.handle("', fname, '",', callbackId, ',', JSON.stringify(args), ')'].join('');
    // avoid ExternalInterface, because of the bugs in
    // http://codinginparadise.org/weblog/2005/12/serious-bug-in-flash-8.html
    throttledGetURL(expr);
    return modifier = {
        onreturn: function(handler) {
            if (!callbackRecord)
                callbacks[callbackId] = callbackRecord = {};
            callbackRecord.onreturn = handler;
            return modifier;
        },
        onexception: function(handler) {
            if (!callbackRecord)
                callbacks[callbackId] = callbackRecord = {};
            callbackRecord.onexception = handler;
            return modifier;
        }
    }
}

function throttledGetURL(expr) {
    _root.getURL(expr);
}
throttledGetURL = throttledGetURL.throttled(100);


FlashBridge.prototype.handleCallback = function(callbackId, result) {
    var handlers = this.callbacks[callbackId],
        onreturn = (handlers||{}).onreturn;
    delete this.callbacks[callbackId];
    onreturn && onreturn(result)
}

FlashBridge.prototype.handleException = function(callbackId, result) {
    var handlers = this.callbacks[callbackId],
        onexception = (handlers||{}).onexception;
    delete this.callbacks[callbackId];
    onexception && onexception(result)
}

FlashBridge = new FlashBridge();
