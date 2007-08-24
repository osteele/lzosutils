/* Copyright 2006-2007 by Oliver Steele.  All rights reserved. */

function staticWrap(view, dx) {
    var x = 0, y = 0, h = 0;
    view.subviews.forEach(function(child) {
        if (x && x + child.width >= view.width) {
            x = 0;
            y += h;
        }
        child.set({x: x, y: y});
        x += child.width + dx;
        h = Math.max(h, child.height);
    });
}
