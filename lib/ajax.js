/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */


/*
 * AJAX
 */

function ajax(options) {
    ajax.setup && ajax.setup(options);
    if (options.proxied)
        return ajax.proxied(options);
    var url = options.url,
        onsuccess = options.success,
        onerror = options.error,
        loader = new LoadVars,
        post = options.type && options.type.toUpperCase()=='POST',
        dataType = options.dataType || 'json';
    if (post) {
        var sender = new LoadVars;
        for (var name in options.data)
            sender[name] = options.data[name];
    } else {
        if (options.data) {
            var queryString = Hash.toQueryString(options.data);
            if (queryString.length)
                url = [url, url.indexOf('?') >= 0 ? '&' : '?', queryString
                      ].join('');
        }
        // add timestamp
        if (!options.cache)
            url = [url, url.indexOf('?') >= 0 ? '&' : '?',
                   '_ts=', (new Date).getTime()].join('');
    }
    loader.onLoad = function(success) {
        if (!success)
            onerror ? onerror() : console.error(url);
    }
    loader.onData = function(response) {
        ajax.lastResult = {url:url, response:response};
        var result = response;
        switch (dataType) {
        case 'html':
            break;
        case 'json':
            var str = response && response.strip();
            result = str && JSON.parse(str);
            if (str && !result || response == undefined)
                return onerror ? onerror() : console.error(url);
            break;
        case 'xml':
            result = new XML(response);
            break;
        }
        ajax.lastResult.result = result;
        onsuccess && onsuccess(result);
    };
    if (ajax.trace) {
        console.info(post ? 'POST' : 'GET', url);
        if (post && options.data) {
            $H(options.data).each(function(item) {
                console.info('  ' + item.key + ':', item.value);
            });
        }
    }
    post
        ? sender.sendAndLoad(url, loader, 'POST')
        : loader.load(url);
}

ajax.proxied = function(options) {
    var url = options.url;
    if (!options.cache)
        url = [url, url.indexOf('?') >= 0 ? '&' : '?',
               '_ts=', (new Date).getTime()].join('');
    var handlers = {
        url: url,               // for debugging
        success: options.success,
        failure: options.error
    };
    var options = {
        url: options.url,
        cache: options.cache || false,
        data: options.data,
        dataType: 'json',
        type: options.type
    };
    // get the defaults
    if (!options.data) delete options.data;
    if (!options.type) delete options.type;
    FlashBridge.call('ajaxProxy', options).
    onreturn(function(record) {
        ajax.handleProxiedResponse(handlers, record.method, record.data);
    });
}

ajax.handleProxiedResponse = function(record, method, data) {
    var callback = record[method];
    // special cases
    switch (method) {
    case 'success':
        // collect it for debugging
        ajax.lastResult = data;
        break;
    case 'error':
        // report an error if the caller isn't going to
        callback || console.error(record.url);
        break;
    }
    callback && callback(data);
}

ajax.get = function(url, params, onsuccess, onerror) {
    if (typeof params == 'function') {
        onerror = onsuccess;
        onsuccess = params;
        params = {};
    }
    ajax({url:url, data:params, success:onsuccess, error:onerror});
}

ajax.post = function(url, params, onsuccess, onerror) {
    if (typeof params == 'function') {
        onerror = onsuccess;
        onsuccess = params;
        params = {};
    }
    ajax({url:url, data:params, success:onsuccess, error:onerror, type:'POST'});
}
