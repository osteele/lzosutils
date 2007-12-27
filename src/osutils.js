/* Copyright 2007 by Oliver Steele.  All rights reserved. */

/*
 * Functions
 */

function setTimeout(fn, ms) {
    var timer = setInterval(function() {
        clearInterval(timer);
        fn();
    }, ms||10);
    return timer;
}

var clearTimeout = clearInterval;

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
