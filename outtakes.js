// returns a function that waits ms before calling the
// underlying function.
Function.prototype.eventually = function(ms) {
    var fn = this;
    return function() {
        var self = this,
            args = Array.slice(arguments, 0);
        run.defer(ms);
        function run(){fn.apply(self, args)};
    }
}

loadImage.active = 0;
loadImage.queue = [];
loadImage.limited = function(url, options) {
    var queueMax = 1;
    if (loadImage.active >= queueMax)
        return loadImage.queue.push([url, options]);
    loadImage.active += 1;
    var onload = options.onload,
        onerror = options.onerror;
    options = Hash.merge({}, options);
    options.onerror = function() {
        onerror && onerror.apply(this, arguments);
        next();
    }
    options.onload = function() {
        onload && onload.apply(this, arguments);
        next();
    }
    loadImage(url, options);
    function next() {
        loadImage.active -= 1;
        if (loadImage.active < 2)
            loadImage.apply(null, loadImage.queue.unshift());
    }
}

/*
 * Queueing
 */

Function.prototype.maxconcurrent = function(max) {
    Debug.warn('untested');
    var fn = this,
        count = 0,
        queue = [];
    wrapper.next = fn.done = function() {
        if (queue.length) {
            var entry = queue.shift();
            wrapper.apply(entry[0], entry[1]);
        }
    }
    function wrapper() {
        if (count > max)
            return queue.push([this, [].slice.call(arguments, 0)]);
        fn.apply(this, arguments);
    }
}

// Gallery.galleries.MINE.pages[0].view.image.getBitmapString().length
LzView.prototype.getBitmapString = function() {
    var mc = this.getMCRef();
    var bitmap = this.bitmap = new flash.display.BitmapData(mc._width, mc._height, true, 0x80FFFFFF);
    bitmap.draw(mc);
    var s = new Array(2*bitmap.width*bitmap.height);
    info(s, s.length);
    var last = null, repeat, uniques = [];
    for (var y = 0, i = 0; y < bitmap.height; y++)
        for (var x = 0; x < bitmap.width; x++) {
            var color = bitmap.getPixel32(x, y);
            if (color == last) {
                ++repeat;
            } else if (last == null) {
                last = color;
                repeat = 1;
            } else {
                var hi = (color >> 16) & 0xffff, lo = color & 0xffff;
                s[i++] = (hi).toString(16);
                s[i++] = (lo).toString(16);
            }
        }
    s.length = i;
    return s.join('');
}


function oldFindBestRelativePosition(view, reference, container, margin) {
    var refBounds = reference.getAbsoluteBounds(container),
        refLeft = refBounds.x,
        refTop = refBounds.y,
        refRight = refBounds.x + refBounds.width,
        refBottom = refBounds.y + refBounds.height;
    var containerBounds = container.getAbsoluteBounds(),
        containerLeft = containerBounds.x,
        containerTop = containerBounds.y,
        containerRight = containerBounds.x + containerBounds.width,
        containerBottom = containerBounds.y + containerBounds.height;
    var x0 = refLeft - view.width - margin,
        x1 = refRight + margin;
    // prefer the right, unless there's no room on the right and
    // there is room on the left
    var x = x1 + view.width > containerRight - margin && x0 >= containerLeft + margin
        ? x0
        : x1;
    var y = refTop;
    // if the reference is clipped on the top, align it with the reference's bottom
    // if there's room
    if (y > reference.getAttributeRelative('y', container) && refBottom - view.height >= containerTop + margin)
        y = refBottom - view.height;
    // if there's not room to the left or right but there is above or below,
    // place it there
    if (x + view.width > containerRight - margin
       || y < containerTop || y + view.height > containerBottom) {
        var y0 = refTop - view.height - margin,
            y1 = refBottom + margin,
            y_ = y0 >= containerTop + margin ? y0
            : y1 + view.height + margin < containerBottom ? y1
            : y;
        if (y != y_) {
            y = y_;
            x = refLeft - containerLeft > containerRight - refRight
                ? refRight - view.width
                : refLeft;
        }
    }
    return {x:x, y:y};
}

/* Native drawRect */

LzDrawView.prototype.__ROUNDRECT_OP = 3;

LzDrawView.prototype._drawRect0 = LzDrawView.prototype.drawRect;
LzDrawView.prototype.drawRect = function(x, y, w, h, rx0, ry0, rx1, ry1) {
    var x1 = x+w, y1 = y+h;
    switch (arguments.length) {
    case 4: rx0 = 0;
    case 5: ry0 = rx0;
    case 6: rx1 = rx0;
    case 7: ry1 = ry0;
    }
    if (rx0 == rx1 || ry0 == ry1)
        this.__path[this.__path.length] = [this.__ROUNDRECT_OP, x, y, w, h, 2*rx0, 2*ry0];
    else
        return this._drawRect0.apply(this, arguments);

}

LzDrawView.prototype.__playPath = function(m) {
    var p = this.__path;
    //_root.Debug.write(p, m);
    for (var i = 0; i < p.length; i++) {
        var op = p[i];
        var optype = op[0];
        switch (optype) {
        case this.__MOVETO_OP:
            m.moveTo(op[1], op[2]);
            break;
        case this.__LINETO_OP:
            m.lineTo(op[1], op[2]);
            break;
        case this.__QCURVE_OP:
            m.curveTo(op[1], op[2], op[3], op[4]);
            break;
        case this.__ROUNDRECT_OP:
            m.drawRoundRect.apply(m, op.slice(1));
            break;
        }
    }
}