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