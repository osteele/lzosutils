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

// view must be within canvas
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
    // -> [[x, type, penalty]]
    function positions(w, r0, r1, c0, c1, m) {
        //info.apply(null,arguments);
        // each entry is [position, type, weight]
        // type is c=container | p=proximal | a=aligned
        var cs = [
            [c0+m, 'c', 0], [c1-m-w, 'c', 0],
            [r0-m-w, 'p', -20], [r1+m, 'p', -10],
            [r0, 'a', -5], [r1-w, 'a', -5]];
        cs.each(function(item) {
            var x = item[0], p = 0, w=5;
            if (x < c0+m) p += w;
            if (x < c0) p += w;
            if (x+w > c1-m) p += w;
            if (x+w < c1) p += w;
            item[2] += p;
        });
        return cs;
    }

    var xs = positions(view.width, refLeft, refRight, containerLeft, containerRight, margin);
    var ys = positions(view.height, refTop, refBottom, containerTop, containerBottom, margin);
    var candidates = [];
    xs.forEach(function(xe) {
        ys.forEach(function(ye) {
            var x = xe[0], y = ye[0];
            var p = xe[2] + ye[2];
            // penalize candidates that overlap the reference
            if (x < refRight && x+view.width > refLeft && y < refBottom && y+view.height > refTop)
                p += 100;
            // penalize catty-corners
            if (xe[1] == 'p' && ye[1] == 'p')
                p += 500;
            // if it's off the canvas, penalize it a lot
            if (x < 0 || y < 0 || x+view.width > canvas.width || y+view.height > canvas.height)
                p += 1000;
            var b = {x: x, y: y, p: p};
            candidates.push(b);
        });
    });
    var best = candidates.sort(function(a,b){return a.p-b.p})[0];
    return {x:best.x, y:best.y};
}
