/* Copyright 2007 by Oliver Steele.  All rights reserved. */

var gHostPrefix = 'http://styleandshare.com';
var gStaticHostPrefix = 'http://images.styleandshare.com';

if (LzBrowser.getLoadURL().indexOf(':8080') >= 0 || LzBrowser.getLoadURL().indexOf('zardoz.dev') >= 0) {
    gHost = 'zardoz.dev';
    gHostPrefix = 'http://' + gHost;
    gStaticHostPrefix = gHostPrefix;
} else if (LzBrowser.getLoadURL().indexOf('staging.styleandshare.com') >= 0) {
    gHostPrefix = 'http://staging.styleandshare.com';
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
    url = [url,
           url.indexOf('?') >= 0 ? '&' : '?',
           '_ts=',
           (new Date).getTime()].join('');
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
        sequenceNumber = state.sequenceNumber++,
        externalInterface = flash.external.ExternalInterface;
    var url = options.url;
    if (url.indexOf('http') != 0)
        url = gHostPrefix + url;
    url = [url,
           url.indexOf('?') >= 0 ? '&' : '?',
           '_ts=',
           (new Date).getTime()].join('');
    state.handlers[sequenceNumber] = {url:url,
                                      success:options.success,
                                      failure:options.error};
    var options = {
        url: options.url,
        cache: false,
        data: options.data,
        dataType: 'json',
        type: options.type
    };
    if (!options.data) delete options.data;
    if (!options.type) delete options.type;
    externalInterface.call("ajaxProxy", sequenceNumber, options);
}

function handleAjaxResponse(sequenceNumber, method, data) {
    var state = ajaxState,
        record = state.handlers[sequenceNumber] || {},
        callback = record[method];
    delete state.handlers[sequenceNumber];
    if (method == 'success') {
        ajax.lastResult = data;
        callback && callback(data);
    } else {
        callback ? callback() : Debug.error(url);
    }
}

if (htmlProxy) {
    ajax = proxiedAjax;
    flash.external.ExternalInterface.addCallback("handleAjaxResponse",
                                                 null, handleAjaxResponse);
}

ajax.get = function(url, params, onsuccess, onerror) {
    if (typeof params == 'function') {
        params = {};
        onsuccess = arguments[1];
        onerror = arguments[2];
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
