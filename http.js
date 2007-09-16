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

// AJAX w/ JSON
function ajax(url, onsuccess, onfailure) {
    if (url.indexOf('http') != 0)
        url = gHostPrefix + url;
    Debug.write('XHR', url);
    url = [url,
           url.indexOf('?') >= 0 ? '&' : '?',
           '_ts=',
           (new Date).getTime()].join('');
    var loader = new LoadVars();
    loader.onLoad = function(success) {
        if (!success)
            onfailure ? onfailure() : Debug.error(url);
    }
    loader.onData = function(data) {
        data = data && data.strip();
        var json = data && JSON.parse(data);
        ajax.lastResult = {url:url, json:json, data:data};
        if ((data && !json) || data == undefined)
            return onfailure ? onfailure() : Debug.error(url);
        onsuccess && onsuccess(json);
    };
    loader.load(url);
}

// JQuery compatability
function $() {}

$.get = function(url, params, options) {
    $.post(url, params, options);
}

// actually does GET
$.post = function(url, params, options, onerror) {
    options = options || {};
    if (typeof options == 'function')
        options = {onsuccess: options};
    if (onerror)
        options.onerror = onerror;
    if (url.indexOf('http') != 0)
        url = gHostPrefix + url;
    var query = Hash.toQueryString(params);
    if (query.length) {
        if (url.indexOf('?') < 0) url += '?';
        url += query;
    }
    ajax(url, options.onsuccess, options.onerror);
}
