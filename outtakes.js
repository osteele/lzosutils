Array.prototype.sortUnder = function(fn) {
    return this.sort(function(a,b) {return fn(a) - fn(b)});
}

function findBestRelativePosition(view, reference, container, margin) {
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

    // width, reference min/max, container min/max
    function positions(w, ra, rb, ca, cb, m) {
        // each entry is [position, type, weight]
        // type is c=container | p=proximal | a=aligned
        var cs = [
            [ca+m, 'c', 0], [cb-m-w, 'c', 0],
            [ra-m-w, 'p', 1], [rb+m, 'p', 2],
            [ra, 'a', 1], [rb-w, 'a', 1]];
        cs.each(function(item) {
            var a = item[0], p = 0;
            if (item+w < ca+m) p += 100;
            if (item+w < ca) p += 100;
            if (item > cb-m) p += 100;
            if (item < cb) p += 100;
            item[1] -= p;
        });
        return cs;
    }

    var xs = positions(view.width, refLeft, refRight, containerLeft, containerRight, m);
    var ys = positions(view.height, refTop, refBottom, containerTop, containerBottom, m);
    var candidates = [];
    xs.forEach(function(xe) {
        ys.forEach(function(ye) {
            var x = xe[0], y = ye[0];
            var w = xe[2] + ye[2];
            // penalize candidates that are proximal in both dimensions
            if (xe[1] == 'p' && xe[2] == 'p')
                w += 100;
            // penalize candidates that overlap the reference
            if (x < refRight && x+view.width > refLeft && y < refBottom && y+view.height > refTop)
                w += 50;
            var b = {x: x, y: y, w: w};
            candidates.push(b);
        });
    });
    var best = candidates.sortUnder('w');
    return {x:best.x, y:best.y};
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