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