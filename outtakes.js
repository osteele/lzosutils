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