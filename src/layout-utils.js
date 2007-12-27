/* Copyright 2006-2007 by Oliver Steele.  All rights reserved. */

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

/*
 * Relative Position
 */

LzView.prototype.moveNextTo = function(referenceView, options) {
    var position = findBestRelativePosition(this, referenceView, options),
        duration = (options||{}).duration;
    (duration
     ? this.to({x:position.x, y:position.y}, duration)
     : this.set({x:position.x, y:position.y}));
}


// view must be within canvas


function findBestRelativePosition(view, reference, options) {
    var defaults = {
        container: canvas,
        margin: 10
    };
    var options = Hash.merge(defaults, options || {}),
        container = options.container,
        margin = options.margin,
        avoid = options.avoid;
    var refBounds = reference.getAbsoluteBounds(container),
        refLeft = refBounds.x,
        refTop = refBounds.y,
        refRight = refBounds.x + refBounds.width,
        refBottom = refBounds.y + refBounds.height;
    var containerBounds = options.outerBounds || container.getAbsoluteBounds(),
        containerLeft = containerBounds.x,
        containerTop = containerBounds.y,
        containerRight = containerBounds.x + containerBounds.width,
        containerBottom = containerBounds.y + containerBounds.height;

    // Consider aligning the left side with the left side of the
    // container ('c'ontainer), the left side of the reference
    // ('a'ligned), and the right side of the reference
    // ('n'eighboring); similarly for left and right reversed.  We
    // prefer right to left, and below to above.
    //
    // :: width, reference min/max, container min/max
    // ::   -> [[x, type, penalty]]
    // each entry is [position, type, weight]
    // type is c=container | p=proximal | a=aligned
    function positions(w, r0, r1, c0, c1, m) {
        var m = margin;
        var items = [
            // aligned to the container
            [c0+m, 'c', 1],   [c1-m-w, 'c', 0],
            // neighboring the reference
            [r0-m-w, 'n', 1], [r1+m, 'n', 0],
            // aligned to the (left, right) side of the reference
            [r0, 'a', 0],     [r1-w, 'a', 1],
            // centered in the reference
            [r0 + (r1 - r0 - w)/2, null, 0]
        ];
        // Penalize for each pixel outside the container.
        for (var i = 0, item; item = items[i++]; ) {
            var x = item[0], p = 0;
            if (x < c0)   p += c0-x;
            if (c1 < x+w) p += x+w-c1;
            item[2] += p*1000000; // 1,000,000
        }
        return items;
    }

    var xs = positions(view.width, refLeft, refRight, containerLeft, containerRight);
    var ys = positions(view.height, refTop, refBottom, containerTop, containerBottom);
    var best = null;
    xs.forEach(function(xr) {
        ys.forEach(function(yr) {
            var x = xr[0], y = yr[0];
            var p = xr[2] + yr[2];
            // penalize candidates that overlap the reference
            if (x < refRight && x+view.width > refLeft && y < refBottom && y+view.height > refTop)
                p += 100000; // 100,000
            // penalize by the size of the union of the rectangles
            var x0 = Math.min(x, refLeft), x1 = Math.max(x+view.width, refRight),
                y0 = Math.min(y, refTop), y1 = Math.max(y+view.height, refBottom);
            p += (x1-x0) + (y1-y0);
            // penalize intersections with siblings
            if (avoid) {
                avoid.each(function(b) {
                    if (b.x <= x+view.width && x <= b.right &&
                        b.y <= y+view.height && y <= b.bottom)
                        p += 200;
                });
            }
            // penalize catty-corners
            // if (xr[1] == 'n' && yrs[1] == 'n')
            //   p += 500;
            if (p < (best.p || p+1))
                best = {x: x, y: y, p: p};
        });
    });
    //var x = best.x, y = best.y;
    return {x:best.x, y:best.y};
}
