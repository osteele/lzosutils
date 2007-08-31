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
        duration = options.duration;
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
        margin = options.margin;
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
