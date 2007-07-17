// todo: add phase, that can be preserved across dashTo's
LzDrawView.prototype.dashTo = function(x, y, intervals) {
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
}

LzDrawView.prototype.withDash = function(intervals, fn) {
    var ol = this.lineTo;
    var nl = this.lineTo = function(x, y) {
        this.lineTo = ol;
        this.dashTo(x, y, intervals);
        this.lineTo = nl;
    }
    fn();
    this.lineTo = ol;
}

LzDrawView.prototype.drawRect = function(x, y, w, h, r0, r1) {
    if (arguments.length <= 4)
        r0 = r1 = 0;
    else if (arguments.length <= 5)
        r1 = r0;
    this.moveTo(x+r0, y);
    this.lineTo(x+w-r0, y);
    this.quadraticCurveTo(x+w, y, x+w, y+r1);
    this.lineTo(x+w, y+h-r1);
    this.quadraticCurveTo(x+w, h, x+w-r0, y+h);
    this.lineTo(x+r0, y+h);
    this.quadraticCurveTo(x, y+h, x, y+h-r1);
    this.lineTo(x, y+r1);
    this.quadraticCurveTo(x, y, x+r0, y);
}
