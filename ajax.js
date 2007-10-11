/* Copyright 2007 by Oliver Steele.  All rights reserved. */

var gHostPrefix = 'http://styleandshare.com';
var gImageHostPrefix = 'http://images.styleandshare.com';
var gStaticHostPrefix = 'http://static.styleandshare.com';

if (Options.network == 'development' || !Options.network) {
    gHost = 'zardoz.dev';
    gHostPrefix = 'http://' + gHost;
    gImageHostPrefix = gHostPrefix;
    gStaticHostPrefix = gHostPrefix;
} else if (Options.network == 'staging') {
    gHostPrefix = 'http://staging.styleandshare.com';
    gStaticHostPrefix = 'http://static.staging.styleandshare.com';
}

LzLoadQueue.maxOpen = 10000;
//LzLoadQueue.__LZmonitorState = true;

/*
 * AJAX
 */

function ajax(options) {
    var url = options.url,
        onsuccess = options.success,
        onerror = options.error;
    url || error('no url');
    if (url.indexOf('http') != 0)
        url = gHostPrefix + url;
    if (options.data) {
        var query = Hash.toQueryString(options.data);
        if (query.length) {
            if (url.indexOf('?') < 0) url += '?';
            url += query;
        }
    }
    Debug.write('XHR', url);
    // add timestamp
    if (!options.cache)
        url = [url, url.indexOf('?') >= 0 ? '&' : '?',
               '_ts=', (new Date).getTime()].join('');
    var loader = new LoadVars();
    loader.onLoad = function(success) {
        if (!success)
            onerror ? onerror() : Debug.error(url);
    }
    loader.onData = function(data) {
        data = data && data.strip();
        var json = data && JSON.parse(data);
        ajax.lastResult = {url:url, json:json, data:data};
        if ((data && !json) || data == undefined)
            return onerror ? onerror() : Debug.error(url);
        onsuccess && onsuccess(json);
    };
    loader.load(url);
}

var ajaxState = {
    sequenceNumber: 0,
    handlers: {}
}

function proxiedAjax(options) {
    var state = ajaxState,
        sequenceNumber = state.sequenceNumber++;
    var url = options.url;
    if (url.indexOf('http') != 0)
        url = gHostPrefix + url;
    if (!options.cache)
        url = [url, url.indexOf('?') >= 0 ? '&' : '?',
               '_ts=', (new Date).getTime()].join('');
    state.handlers[sequenceNumber] = {url:url,
                                      success:options.success,
                                      failure:options.error};
    var options = {
        url: options.url,
        cache: options.cache||false,
        data: options.data,
        dataType: 'json',
        type: options.type
    };
    if (!options.data) delete options.data;
    if (!options.type) delete options.type;
    FlashBridge.call('ajaxProxy', sequenceNumber, options);
}

function handleAjaxResponse(sequenceNumber, method, data) {
    var state = ajaxState,
        record = state.handlers[sequenceNumber] || {},
        callback = record[method];
    delete state.handlers[sequenceNumber];
    // special cases
    switch (method) {
    case 'success':
        // collect it for debugging
        ajax.lastResult = data;
        break;
    case 'error':
        // report an error if the caller isn't going to
        callback || Debug.error(record.url);
        break;
    }
    callback && callback(data);
}

if (htmlProxy) {
    ajax = proxiedAjax;
    flash.external.ExternalInterface.addCallback("handleAjaxResponse",
                                                 null, handleAjaxResponse);
}

ajax.get = function(url, params, onsuccess, onerror) {
    if (typeof params == 'function') {
        onerror = onsuccess;
        onsuccess = params;
        params = {};
    }
    ajax({url:url, data:params, success:onsuccess, error:onerror});
}

// when using LoadVars implementation does GET instead
ajax.post = function(url, params, onsuccess, onerror) {
    if (typeof params == 'function') {
        params = {};
        onsuccess = arguments[1];
        onerror = arguments[2];
    }
    ajax({url:url, data:params, success:onsuccess, error:onerror, type:'POST'});
}

// Additional options:
// - fallback: replacement options if the first call fails
// - retries: retry this many times; a number or
//            {count::Number, before::function, throttle::ms, backoff::%}
// The retry +before+ function should return false to suppress the retry.
// It is called with two arguments: the number of the current retry,
// and a function that initiates the next retry.
// (+before+ and +throttle+ are not implemented.)
ajax.superGet = function(options) {
    options = Hash.merge({}, options);
    var onerror = options.error,
        retries = options.retries;
    if (retries)
        options.retries = (retries instanceof Number
                           ? {count:retries}
                           : Hash.merge({}, retries));
    options.error = function() {
        var fallback = options.fallback,
            retries = options.retries;
        if (fallback) {
            delete options.fallback;
            Hash.merge(options, fallback);
            ajax.superGet(options);
        } else if (retries && retries.count >= 0) {
            retries.count -= 1;
            ajax.superGet.bind(null, options).defer(1000);
        } else
            onerror && onerror.apply(this, argument);
    }
    ajax(options);
}