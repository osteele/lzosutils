/* Copyright 2006-2008 by Oliver Steele.  All rights reserved. */

// DON'T CALL ME.  Use +FlashBridge.initialize+ to set up the bridge.
function FlashBridge(id, options) {
    var self = this;
    options = options || {};
    this.trace = options.trace;
    
    // swfobject, unlike flashobject, inserts the object tag
    // asynchronously.  Give it a few frames to work (default 12K retries
    // * 50ms/retry = 10m).
    var retries = options.retries || 12000,
        thread = setMovieObject() || setInterval(function() {
            self.info('Looking for #' + id + ': ' + retries + ' retries left');
            if (setMovieObject()) {
                clearInterval(thread);
                self.info('Found #' + id);
                return;
            }
            if (--retries > 0)
                return;
            clearInterval(thread);
            self.info('Looking for #' + id + ': timed out');
            (options.loaderror || function() {
                window.console && console.error &&
                    console.error('FlashBridge failed to find #' + id);
            })();
        }, options.retryInterval || 50);
    // Even if the movie has loaded, it may not have registered the
    // necessary methods.  +synchronize+ queues calls it until it
    // responds to a ping.
    this.callWithoutCapturing = this.call;
    this.synchronize();
    
    function setMovieObject() {
        var elt = document.getElementById(id);
        // has it changed yet?
        if (elt && elt.tagName.match(/object|embed/i)) {
            self.object = elt;
            return true;
        }
    }
}

// "becomes singleton" pattern.  Replaces the class by an instance
// attached to a particular movie.  There is no current support for
// multiple FlashBridge instances (say, attached to multiple objects).
FlashBridge.initialize = function(id, options) {
    FlashBridge = new FlashBridge(id, options);
}

FlashBridge.prototype.info = function(msg) {
    this.trace && console.info('FlashBridge: ' + msg);
}

FlashBridge.prototype.call = function(functionName) {
    var target = this.object,
        name = functionName,
        args = arguments,
        alwaysLookupMethod = true;
    if (name.indexOf('.') >= 0 || alwaysLookupMethod) {
        args = Array.prototype.slice.call(arguments, 0);
        args.unshift(name);
        args[1] = name.split('.');
        args[0] = name = 'handleFlashbridgeCall';
    }
    target[name] || console.error('FlashBridge: undefined method name ' + name);
    // Construct a function that delegates to the target with the right
    // arity.  These simpler implementations don't work:
    // - invoking target[name]'s call() or apply() methods
    // - storing target[name] in a temporary variable, and calling *that*
    var delegators = this.delegationFunctions = this.delegationFunctions || {},
        fn = delegators[args.length];
    if (!fn) {
        var body = ['return this.object[name]('];
        for (var i = 1; i < args.length; i++) {
            i > 1 && body.push(',');
            body.push('arguments[', i, ']');
        }
        body.push(')');
        fn = delegators[args.length] = new Function('name', body.join(''));
    }
    var t0 = new Date;
    fn.apply(this, args);
    this.trace && console.info('FlashBridge: call', functionName, arguments)
    this.time && console.info('FlashBridge:', functionName, new Date - t0);
}

FlashBridge.prototype.define = function(name, fn) {
    this[name] = function() {
        var args = [name].concat([].slice.call(arguments, 0));
        this.call.apply(this, args);
    };
}

FlashBridge.prototype.handleCall = function(fname, sequenceNumber, args) {
    var movie = this.object,
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
        FlashBridge.object.handleFlashbridgeException(sequenceNumber, e.toString());
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
    var calls = this.deferredCalls;
    while (calls.length)
        this.callWithoutCapturing.apply(this, calls.shift());
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
            console.error('initialization timed out');
        }
        self.sendPing();
    }, 1000);
}

FlashBridge.prototype.sendPing = function() {
    this.info('ping');
    var target = this.object;
    if (target && target.handleFlashbridgePing)
        target.handleFlashbridgePing();
}

FlashBridge.prototype.handlePong = function() {
    this.info('pong');
    this.stopCapturingCalls();
    this.playCapturedCalls();
}
