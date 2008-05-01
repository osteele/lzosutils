/* Copyright 2006-2008 by Oliver Steele.  All rights reserved. */

/*
 * JS Bridge
 */

var FlashBridge = {};

FlashBridge.initialize = function() {
    this.registeredCallbacks = {};
    this.callbacks = {};
    this.nextSequenceNumber = 0;
    this.callWithoutQueue = this.call;
    this.synchronize();
    var ExternalInterface = flash.external.ExternalInterface;
    ExternalInterface.addCallback("handleFlashbridgePing",
                                  this, this.handlePing);
    ExternalInterface.addCallback("handleFlashbridgeCall",
                                  this, this.handleCall);
    ExternalInterface.addCallback("handleFlashbridgeCallback",
                                  this, this.handleCallback);
    ExternalInterface.addCallback("handleFlashbridgeException",
                                  this, this.handleException);
}

// Register a calback here.  This both registers it as a method on the
// browser-side object via ExternalInterface, and as a whitelist call
// via browser-side FlashBridge.  The latter is only necessary if you
// call +FlashBridge.secure+ (in the plugin), otherwise everything is
// whitelisted.
FlashBridge.register = function(name, thisObject, fn) {
    if (!fn)
        return this.register(name, null, thisObject);
    this.registeredCallbacks[name] = true;
    if (thisObject || fn)
        flash.external.ExternalInterface.addCallback(name, thisObject, fn);
}

// Call this to prevent the Flash side of the bridge from accepting
// arbitrary calls.
FlashBridge.secure = function() {
    var self = this;
    this.secured = function(name) {
        while (name instanceof Array)
            name = name[0];
        return self.registeredCallbacks[name];
    };
}

FlashBridge.allow = function(name) {
    this.registeredCallbacks[name] = true;
}

FlashBridge.call = function(fname) {
    var args = Array.slice(arguments, 1),
        callbacks = this.callbacks,
        sequenceNumber = this.nextSequenceNumber++,
        callbackRecord = null,
        modifier,
        expr = [
            'FlashBridge.handleCall("', fname, '",', sequenceNumber, ',',
            JSON.stringify(args), ')'
        ].join('');
    // don't use ExternalInterface to make the call, because of the bugs in
    // http://codinginparadise.org/weblog/2005/12/serious-bug-in-flash-8.html
    LzBrowser.exec(expr);
    return modifiers = {
        onreturn: function(handler) {
            if (!callbackRecord)
                callbacks[sequenceNumber] = callbackRecord = {};
            callbackRecord.onreturn = handler;
            return modifiers;
        },
        onexception: function(handler) {
            if (!callbackRecord)
                callbacks[sequenceNumber] = callbackRecord = {};
            callbackRecord.onexception = handler;
            return modifiers;
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

FlashBridge.handleCall = function(path) {
    if (this.secured && !this.secured(path[0])) {
        console.error('FlashBridge: denied access to ' + path[0]);
        return;
    }
    var object = _root;
    while (path.length > 1)
        object = object[path.shift()];
    object[path[0]].apply(object, Array.prototype.slice.call(arguments, 1));
}

/*
 * Synchronization
 */

FlashBridge.sendPong = function() {
    FlashBridge.callWithoutQueue('FlashBridge.handlePong');
}

FlashBridge.handlePing = function() {
    this.sendPong();
    this.call = this.callWithoutQueue;
    this.playQueue();
}

FlashBridge.playQueue = function() {
    var queue = this.callQueue;
    while (queue.length) {
        var record = queue.shift(),
            modifiers = this.callWithoutQueue.apply(this, record);
        record.onreturn && modifiers.onreturn(record.onreturn);
        record.onexception && modifiers.onexception(record.onexception);
    }
}

FlashBridge.synchronize = function() {
    var queue = this.callQueue = [];
    this.call = function() {
        var record = Array.slice(arguments, 0);
        queue.push(record);
        return {
            onreturn: function(handler) {
                record.onreturn = handler;
                return this;
            },
            onexception: function(handler) {
                record.onexception = handler;
                return this;
            }
        }
    }
}


/*
 * Remote Proxy
 */

FlashBridge.createRemoteProxy = function(remoteObjectName, methodNames) {
    var proxy = {};
    for (var ix = 0; ix < methodNames.length; ix++) {
        var methodName = methodNames[ix];
        proxy[methodName] = defineMethod(remoteObjectName, methodName);
    }
    return proxy;
    
    function defineMethod(remoteObjectName, methodName) {
        var fname = remoteObjectName + '.' + methodName;
        return function() {
            var args = Array.slice(arguments);
            args.unshift(fname);
            return FlashBridge.call.apply(FlashBridge, args);
        } 
    }
}


/*
 * Utilities
 */

Array.slice || (Array.slice = (function() {
    var slice = Array.prototype.slice;
    return function(array) {
        return slice.apply(array, slice.call(arguments, 1));
    }
})());

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
