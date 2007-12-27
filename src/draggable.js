/* Copyright 2007 by Oliver Steele.  All rights reserved. */

/*
 * Dragger
 */

Dragger = {}

Dragger.start = function(view) {
    var state = Dragger.state = {
        view: view,
        start: {x: canvas.getMouse('x'), y: canvas.getMouse('y')},
        last: {x: canvas.getMouse('x'), y: canvas.getMouse('y')},
        virtual: {x: view.x, y: view.y},
        resizing: false
    };
    if (view['resizeHandle'] && view.resizeHandle.containsMouse()) {
        state.resizing = true;
        state.ratio = view.width / view.height;
        state.startSize = {width: view.width, height: view.height};
    }
}

Dragger.stop = function() {}

Dragger.handleMouseMove = function(view, x, y) {
    var state = Dragger.state;
    var dx = x - state.last.x;
    var dy = y - state.last.y;
    state.last = {x: x, y: y};
    if (dx == 0 && dy == 0) return;
    if (view != state.view) return;
    if (state.resizing) {
        var width = w = Math.max(40, state.startSize.width + canvas.getMouse('x') - state.start.x);
        var height = h = Math.max(40, state.startSize.height + canvas.getMouse('y') - state.start.y);
        var ratio = width / height;
        if (false) {
            if (ratio < state.ratio)
                width = height * state.ratio;
            else
                height = width / state.ratio;
        }
        //info(w, h, ratio, width, height, width/height, state.ratio)
        view.setWidth(width);
        view.setHeight(height);
    } else {
        var x = state.virtual.x += dx;
        var y = state.virtual.y += dy;
        var container = canvas, margin = 20;
        view.setX(Math.max(margin-view.width, Math.min(canvas.width-margin, x)));
        view.setY(Math.max(margin-view.height, Math.min(canvas.height-margin, y)));
    }
}

LzView.prototype.makeDraggable = function() {
    var view = this;
    var delegate = new LzDelegate({run: function() {
        Dragger.handleMouseMove(view, canvas.getMouse('x'), canvas.getMouse('y'));
    }}, 'run');
    this.observe('onmousedown', function() {
        Dragger.start(view);
        delegate.register(LzIdle, 'idle');
    });
    this.observe('onmouseup', function() {
        Dragger.stop(self);
        delegate.unregisterAll();
    });
}