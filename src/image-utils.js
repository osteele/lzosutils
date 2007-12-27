/* Copyright 2007 by Oliver Steele.  All rights reserved. */

/*
 * Image loading
 */

function loadImage(url, options) {
    var mcl = new MovieClipLoader,
        ix = arguments.callee.ix = (arguments.callee.ix||0)+1,
        name = 'loadMyImage' + ix,
        mc = options.mc || createEmptyMovieClip(name, 1);
    var listener = {
            onLoadStart: function() {
                options.hide && (mc._visible = false);
            },
            onLoadError: function(mc, errorCode, httpStatus) {
                options.onerror || error('image', url);
                options.onerror && options.onerror(errorCode, httpStatus);
            },
            // later than onLoadComplete
            onLoadInit: function(mc, httpStatus) {
                options.onload && options.onload(mc, httpStatus);
            }
        };
    mcl.addListener(listener);
    mcl.loadClip(url, mc);
    return mc;
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
    var mc = this.getClip();
    var bitmap = this.bitmap =
        new flash.display.BitmapData(mc._width, mc._height, true, 0xFFFF0000);
    bitmap.draw(mc);
    Image.removeBackground(bitmap);
    if (trim) {
        info('tirm');
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

LzView.prototype.smoothBitmap = function() {
    var mc = this.getClip(),
        bitmap = this.bitmap =
        new flash.display.BitmapData(mc._width, mc._height, true, 0x00000000);
    bitmap.draw(mc);
    mc.attachBitmap(bitmap, mc.getNextHighestDepth(), 'always', true);
}