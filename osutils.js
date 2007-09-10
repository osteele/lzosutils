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
 * Functions
 */

function setTimeout(fn, ms) {
    var obj = {run:fn};
    LzTimer.addTimer(new LzDelegate(obj, 'run'), ms);
    return obj;
}

function clearTimeout(obj) {
    obj.run = function(){};
}

var Event = {
    observe: function(target, eventName, fn) {
        new LzDelegate({run:fn}, 'run', target, eventName);
    }
};

LzNode.prototype.observe = function(eventName, fn) {
    info('register', eventName, this);
    return new LzDelegate({run:fn}, 'run', this, eventName);
};


/*
 * Math
 */

// Pin x to the range [a, b], where m = 20
Math.pinToRange = function(x, a, b) {
    return Math.max(a, Math.min(b, x));
}


/*
 * Image processing
 */

var Image = {};

Image.removeBackground = function(bitmap) {
    var l = 30;
    var w = bitmap.width - 1;
    var h = bitmap.height - 1;
    for (var x = 0; x < w+l; x += l) {
        x = Math.min(w, x);
        for (var y = 0; y < h+l; y += l) {
            y = Math.min(h, y);
            if (bitmap.getPixel(x, y) == 0xffffff) {
                bitmap.floodFill(x, y, 0);
            }
        }
    }
}

LzView.prototype.removeBitmapBackground = function(trim, sib) {
    //var info = trim ? global.info : function(){};
    trim = false;
    var mc = this.getMCRef() || this.makeContainerResource();
    var bitmap = this.bitmap =
        new flash.display.BitmapData(mc._width, mc._height, true, 0);//0xFFFFFFFF);
    bitmap.draw(mc);
    Image.removeBackground(bitmap);
    if (trim) {
        var bounds = bitmap.getColorBoundsRect(0xFF000000, 0x00000000, true);
        info(bounds);
        if (bounds.x || bounds.y ||
            bounds.right < bitmap.width ||
            bounds.top < bitmap.height) {
            bitmap = this.bitmap = new flash.display.BitmapData(
                bounds.width,
                bounds.height,
                true, 0);//0x80FFFFFF);
            info('<-');
            //var matrix = new flash.geom.Matrix;
            //matrix.translate(-bounds.x,0);
            //bitmap.draw(mc, matrix);
            bitmap.draw(mc);
            Image.removeBackground(bitmap);
        }
    }
    if (sib) {
        this.set('opacity', .2);
        mc = sib.getMCRef() || sib.makeContainerResource();
        sib.set({width: bitmap.width, height: bitmap.height, bgcolor: 0xff0000});
        info(bitmap.width, bitmap.height);
    }
    mc.attachBitmap(bitmap, mc.getNextHighestDepth(), 'always', true);
}

function animateRect(sourceView, targetView) {
    return;
    var sourceRect = sourceView.getGlobalBounds();
    var targetRect = targetView.getGlobalBounds();
    var view = new ZoomRect(canvas, sourceRect);
    targetRect.vanish = 1;
    view.animators(targetRect, 500);
}


/*
 * Misc.
 */

var Template = {};

Template.expand = function(text, table) {
    var spans = [];
    for (var i = 0; i < text.length; ) {
        var i0 = text.indexOf('#{', i);
        if (i0 < 0) break;
        var i1 = text.indexOf('}', i0);
        if (i1 < 0) break;
        i0 > i && spans.push(text.slice(i, i0));
        var key = text.slice(i0+2, i1);
        spans.push(table[key]);
        i = i1+1;
    }
    text.length > 0 && spans.push(text.slice(i));
    return spans.join('');
}

Number.prototype.toCardinal = function(max) {
    var cardinals = arguments.callee.cardinals = arguments.callee['cardinals'] || ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    return this <= (max || Infinity) && cardinals[this] || String(this);
}

var Size = function(width, height) {
    this.width = width;
    this.height = height;
}

Size.prototype.maxSizeTo = function(maxWidth, maxHeight) {
    arguments.length < 1 && (maxHeight = maxWidth);
    var width = Math.min(this.width, maxWidth);
    var height = Math.min(this.height, maxHeight);
    var ratio = this.width / this.height;
    if (width / height > ratio)
        width = height * ratio;
    else
        height = width / ratio;
    return new Size(width, height);
}

// requires that start tags are of the form '<a ' (the tagname is
// a space, not another form of whitespace), and that end tags are
// exactly '</a>'.  Doesn't deal with nested links.
String.prototype.colorizeLinks = function() {
    return (this
            .replace('<a ', '<font color="#0000ff"><a ')
            .replace('</a>', '</a></font>'));
}

LzBrowser.makeHTMLCallback = function(fname, arg) {
    return ['asfunction:_root.', fname, ',', arg].join('');
}


/*
 * AJAX
 */

// AJAX w/ JSON
function ajax(url, onsuccess, onfailure) {
    if (url.indexOf('http') != 0) url = gHostPrefix + url;
    Debug.write('XHR', url);
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
$.post = function(url, params, options) {
    if (typeof options == 'function') {
        options = {onsuccess: options};
        if (arguments.length >= 4)
            options.onerror = arguments[3];
    }
    if (url.indexOf('http') != 0)
        url = gHostPrefix + url;
    var query = Hash.toQueryString(params);
    if (query.length) {
        if (url.indexOf('?') < 0) url += '?';
        url += query;
    }
    ajax(url, options['onsuccess'], options['onerror']);
}


/*
 * JS Bridge
 */

var FlashBridge = function() {
    this.callbacks = {};
    this.nextId = 0;
//     flash.external.ExternalInterface.addCallback("info", null, function(){
//         info.apply(null, arguments);
//     });
    if (typeof flash == 'undefined') return;
    flash.external.ExternalInterface.addCallback("handleCallback",
                                                 this, this.handleCallback);
    this.register('info', function() {info.apply(null,  arguments)});
}

FlashBridge.prototype.register = function(name, fn) {
    flash.external.ExternalInterface.addCallback(name, null, fn);
}

FlashBridge.prototype.call = function(fn) {
    var args = [];
    for (var i = 1; i < arguments.length; i++)
        args.push(arguments[i]);
    var callback = null;
    var callbackId = 0;
    if (callback) {
        callbackId = ++this.nextId;
        this.callbacks[id] = callback;
    }
    var expr = ['FlashBridge.handle("', fn, '",', JSON.stringify(args), ')'].join('');
    info(expr);
    LzBrowser.loadJS(expr);
}

FlashBridge.prototype.handleCallback = function(callbackId, result) {
    var handler = this.callbacks[callbackId];
    delete this.callbacks[callbackId];
    handler && handler(result)
}

FlashBridge = new FlashBridge();
