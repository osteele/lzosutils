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
    // add timestamp
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

var ajaxState = {
    callbacks: {},
    sequenceNumber: 0
}

function proxiedAjax(url, onsuccess, onfailure) {
    var state = ajaxState,
        sequenceNumber = state.sequenceNumber++,
        externalInterface = flash.external.ExternalInterface;
    if (url.indexOf('http') != 0)
        url = gHostPrefix + url;
    url = [url,
           url.indexOf('?') >= 0 ? '&' : '?',
           '_ts=',
           (new Date).getTime()].join('');
    state.callbacks[sequenceNumber] = {onsuccess:onsuccess, onfailure:onfailure};
    externalInterface.call("ajaxProxy", url, sequenceNumber);
}

function handleAjaxResponse(sequenceNumber, url, success, data) {
    var state = ajaxState,
        callbacks = state.callbacks,
        record = callbacks[sequenceNumber] || {};
    delete callbacks[sequenceNumber];
    if (success) {
        ajax.lastResult = data;
        record.onsuccess && record.onsuccess(data);
    } else {
        record.onfailure ? record.onfailure() : Debug.error(url);
    }
}

if (htmlProxy) {
    ajax = proxiedAjax;
    flash.external.ExternalInterface.addCallback("handleAjaxResponse",
                                                 null, handleAjaxResponse);
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
