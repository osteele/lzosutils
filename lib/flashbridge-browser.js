/* Copyright 2006-2008 by Oliver Steele.  All rights reserved. */

function FlashBridge(id) {
    var self = this;
    this.callWithoutCapturing = this.call;
    this.synchronize();
    var count = 10,
        thread = setMovieObject() || setInterval(function() {
            if (setMovieObject())
                return clearInterval(thread);
            if (--count <= 0) {
                window.console && console.error && console.error('no id=' + id);
                clearInterval(thread);
            }
        }, 10);
    function setMovieObject() {
        var elt = document.getElementById(id);
        if (elt && elt.tagName.match(/object|embed/i)) {
            self.movie = elt;
            return true;
        }
    }
}

FlashBridge.initialize = function(id) {
    // "becomes singleton" pattern
    FlashBridge = new FlashBridge(id);
}

FlashBridge.prototype.call = function(name) {
    // These don't work:
    // - storing m[name] in a temporary variable, and calling *that*
    // - invoking m[name]'s call() or apply() methods
    var m = this.movie,
        args = arguments;
    if (name.indexOf('.') >= 0) {
        args = Array.prototype.slice.call(arguments, 0);
        args.unshift(null);
        args[1] = name.split('.');
        name = 'handleFlashbridgeCall';
    }
    m[name] || console.error('FlashBridge: undefined method name ' + name);
    switch (args.length-1) {
    case 0: return m[name]();
    case 1: return m[name](args[1]);
    case 2: return m[name](args[1], args[2]);
    case 3: return m[name](args[1], args[2], args[3]);
    case 4: return m[name](args[1], args[2], args[3], args[4]);
    default: raise('unimplemented argument count:' + (a.length-1));
    }
}

FlashBridge.prototype.define = function(name, fn) {
    this[name] = function() {
        var args = [name].concat([].slice.call(arguments, 0));
        this.call.apply(this, args);
    };
}

function lzapp_DoFSCommand(fname, args) {
    args = JSON.parse(args);
    var target = null,
        ix = fname.indexOf('.');
    if (ix > 0) {
        target = eval(fname.substring(0, ix));
        fname = fname.substring(ix+1);
    }
    window[fname].apply(target, args);
}

FlashBridge.prototype.handle = function(fname, sequenceNumber, args) {
    var movie = this.movie,
        returnToken = function(result) {
            movie.handleFlashbridgeCallback(sequenceNumber, result);
        };
    try {
        FlashBridge.takeReturnToken = function(receiver) {
            var result = returnToken;
            returnToken = null;
            return result;
        }
        var result,
            ix = fname.indexOf('.');
        if (ix > 0) {
            var target = eval(fname.substring(0, ix));
            fname = fname.substring(ix+1);
            result = target[fname].apply(target, eval(args));
        } else
            result = eval(fname).apply(null, eval(args));
    } catch (e) {
        window.console && console.error && console.error(e);
        // 'finally' gets an error in MSIE6, so delete the token both
        // inside and outside the catch
        delete FlashBridge.takeReturnToken;
        FlashBridge.movie.handleFlashbridgeException(sequenceNumber, e.toString());
        throw e; // so that we can debug it in the console
    }
    delete FlashBridge.takeReturnToken;
    returnToken && returnToken(result);
}


/*
 * Remote Proxy
 */

FlashBridge.prototype.createRemoteProxy = function(remoteObjectName, methodNames) {
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
 * Call Capturing
 */

FlashBridge.prototype.callWithCapturing = function(name) {
    this.deferredCalls.push(Array.prototype.slice.call(arguments, 0));
}

FlashBridge.prototype.playCapturedCalls = function() {
    for (var i = 0; i < this.deferredCalls.length;i ++)
        this.callWithoutCapturing.apply(this, this.deferredCalls[i]);
}

FlashBridge.prototype.startCapturingCalls = function() {
    if (this.capturingCalls) return;
    this.capturingCalls = true;
    this.call = this.callWithCapturing;
    this.deferredCalls = [];
}

FlashBridge.prototype.stopCapturingCalls = function() {
    if (!this.capturingCalls) return;
    this.capturingCalls = false;
    this.call = this.callWithoutCapturing;
}


/*
 * Initialization Handshake
 */

FlashBridge.prototype.synchronize = function(timeout) {
    var startTime = new Date,
        self = this;
    timeout = timeout || 10*60*1000;
    this.startCapturingCalls();
    this.sendPing();
    var thread = setInterval(function() {
        if (!self.capturingCalls)
            return clearInterval(thread);
        if (new Date - startTime > timeout) {
            clearInterval(thread);
            console.error('FlashBridge initialization timed out');
        }
        self.sendPing();
    }, 1000);
}

FlashBridge.prototype.sendPing = function() {
    if (this.movie && this.movie.handleFlashbridgeCall)
        this.callWithoutCapturing('FlashBridge.handlePing');
}

FlashBridge.prototype.handlePong = function() {
    this.stopCapturingCalls();
    this.playCapturedCalls();
}
