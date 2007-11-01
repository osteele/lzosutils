/* Copyright 2007 by Oliver Steele.  All rights reserved. */

(function(define) {
    // todo: add phase, that can be preserved across dashTo's
    define('dashTo', function(x, y, intervals) {
        intervals = intervals || [5];
        var ix = 0;
        var x0 = 0, y0 = 0;
        if (this.__path.length) {
            var instr = this.__path[this.__path.length - 1];
            x0 = instr[instr.length - 2];
            y0 = instr[instr.length - 1];
        }
        var dx = x - x0;
        var dy = y - y0;
        var s = Math.sqrt(dx*dx + dy*dy);
        if (!s) return;
        dx /= s;
        dy /= s;
        var verb = ['moveTo', 'lineTo'];
        var penDown = 1;
        for (var t = 0; t < s; t += intervals[ix++]) {
            if (ix >= intervals.length)
                ix = 0;
            this[verb[penDown]](x0 + t * dx, y0 + t * dy);
            penDown = penDown ^ 1;
        }
    });

    define('withDash', function(intervals, fn) {
        var ol = this.lineTo;
        var nl = this.lineTo = function(x, y) {
            this.lineTo = ol;
            this.dashTo(x, y, intervals);
            this.lineTo = nl;
        }
        fn();
        this.lineTo = ol;
    });

    define('drawRect', function(x, y, w, h, rx0, ry0, rx1, ry1) {
        var x1 = x+w, y1 = y+h;
        switch (arguments.length) {
        case 4: rx0 = 0;
        case 5: ry0 = rx0;
        case 6: rx1 = rx0;
        case 7: ry1 = ry0;
        }
        this.moveTo(x+rx0, y);
        this.lineTo(x1-rx1, y);
        this.quadraticCurveTo(x1, y, x1, y+ry0);
        this.lineTo(x1, y1-ry1);
        this.quadraticCurveTo(x1, y1, x1-rx1, y1);
        this.lineTo(x+rx0, y1);
        this.quadraticCurveTo(x, y1, x, y1-ry1);
        this.lineTo(x, y+ry0);
        this.quadraticCurveTo(x, y, x+rx0, y);
    });

    define('setGradient', function(x0, y0, x1, y1, stops) {
        var g = this.fillStyle = this.createLinearGradient(x0,y0,x1,y1),
            savedOpacity = this.globalAlpha,
            opacity = savedOpacity,
            color;
        for (var i = 0; i < stops.length; i++) {
            var stop = stops[i],
                offset = i / (stops.length-1);
            if (typeof stop == 'number')
                color = stop;
            else {
                stop = Hash.merge({offset:offset, color:color, opacity:opacity},
                                  stop);
                color = stop.color;
                offset = stop.offset;
                opacity = stop.opacity;
            }
            this.globalAlpha = opacity;
            g.addColorStop(offset, color);
        }
        this.globalAlpha = savedOpacity;
    });

})(LzDrawView
   ? function(n, fn) {LzDrawView.prototype[n] = fn}
   : function(n, fn) {lz.drawview.addProperty(n, fn)});