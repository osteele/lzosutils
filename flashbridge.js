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
    _root.getURL(expr);
    return modifier = {
        onsuccess: function(handler) {
            if (!callbackRecord)
                callbacks[callbackId] = callbackRecord = {};
            callbackRecord.onsuccess = handler;
            return modifier;
        },
        onerror: function() {
            if (!callbackRecord)
                callbacks[callbackId] = callbackRecord = {};
            return modifier;
        }
    }
}

FlashBridge.prototype.handleCallback = function(callbackId, result) {
    var handlers = this.callbacks[callbackId],
        onsuccess = (handlers||{}).onsuccess;
    delete this.callbacks[callbackId];
    onsuccess && onsuccess(result)
}

FlashBridge = new FlashBridge();
