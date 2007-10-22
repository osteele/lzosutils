/* Copyright 2007 by Oliver Steele.  All rights reserved. */

/*
 * JS Bridge
 */

var FlashBridge = function() {
    this.callbacks = {};
    this.callbackId = 0;
//     flash.external.ExternalInterface.addCallback("info", null, function(){
//         info.apply(null, arguments);
//     });
    flash.external.ExternalInterface.addCallback("handleFlashbridgeCallback",
                                                 this, this.handleCallback);
    flash.external.ExternalInterface.addCallback("handleFlashbridgeException",
                                                 this, this.handleException);
    this.register('info', function() {info.apply(null,  arguments)});
}

FlashBridge.prototype.register = function(name, thisObject, fn) {
    if (!fn) {
        fn = thisObject;
        thisObject = null;
    }
    flash.external.ExternalInterface.addCallback(name, thisObject, fn);
}

FlashBridge.prototype.call = function(fn) {
    var args = [].slice.call(arguments, 1),
        callbacks = this.callbacks,
        callbackId = ++this.callbackId,
        callbackRecord = null,
        modifier,
        expr = ['javascript:FlashBridge.handle("', fn, '",', callbackId, ',', JSON.stringify(args), ')'].join('');
    // avoid ExternalInterface, because of the bugs in
    // http://codinginparadise.org/weblog/2005/12/serious-bug-in-flash-8.html
    //info(expr);
    //_root.getURL(expr);
    //myfs(fn, JSON.stringify(args));
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
