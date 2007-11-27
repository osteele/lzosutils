/* Copyright 2006-2007 by Oliver Steele.  All rights reserved. */

function defineMethods(klass, methods) {
    for (var name in methods)
        klass.prototype[name] = methods[name];
}

/*
 * Attributes
 */

defineMethods(LzNode, {
    set: function(name, value) {
        if (typeof name == 'object') {
            var properties = name;
            for (name in properties)
                this.setAttribute(name, properties[name]);
        } else {
            if (arguments.length < 2) value = true;
            this.setAttribute(name, value);
        }
        return this;
    },

    // above with inlined setAttribute
    set0: function(name, value) {
        if (typeof name == 'object') {
            var properties = name;
            for (name in properties) {
                var value = properties[value],
                    setter = this.setters[name];
                setter == null
                    ? this['on' + name].sendEvent(this[name] = value)
                    : this[setter](value);
            }
        } else {
            if (arguments.length < 2) value = true;
            var setter = this.setters[name];
            setter == null
                ? this['on' + name].sendEvent(this[name] = value)
                : this[setter](value);
        }
        return this;
    },

    unset: function(name) {
        this.set(name, false);
        return this;
    },

    to: function(name, value, duration, relative, rest) {
        if (typeof name == 'object') {
            var hash = name;
            for (name in hash)
                // shifted by one
                this.animate(name, hash[name], value, duration, relative);
            return this;
        }
        var durationNames = {slow: 600, normal: 400, fast: 200};
        if (arguments.length < 3)
            duration = 'normal';
        if (durationNames[duration])
            duration = durationNames[duration];
        this.animate(name, value, duration, relative, rest);
        return this;
    },

    toggle: function(name) {
        if (!arguments.length) name = 'visible';
        this.set(name, !this[name]);
    },

    animators: function(properties, duration) {
        for (var name in properties) {
            this.animate(name, properties[name], duration);
        }
        return;
        var self = this;
        Hash.each(properties, function(name, value) {
            self.animate(name, value, duration);
        });
    }
});


/*
 * Nodes
 */

Array.destroyAll = function(items) {
    items.invoke('destroy');
}


/*
 * Views
 */

// LFC version is off by one
LzView.prototype.containsPt = function(x, y) {
    return 0 <= x && x < this.width &&
        0 <= y && y < this.height;
}

LzView.prototype.containsMouse = function() {
    return this.containsPt(this.getMouse('x'), this.getMouse('y'));
}

LzView.prototype.containsMouse.dependencies = LzView.prototype.getMouse.dependencies;

LzView.prototype.destroyDirectInstances = function(klass) {
    var destroys = [];
    this.subviews.forEach(function(e) {
        if (e instanceof klass)
            destroys.push(e);
        else
            e.destroyDirectInstances(klass);
    });
    destroys.invoke('destroy');
}

LzView.prototype.moveTo = function(x, y) {
    this.setX(x);
    this.setY(y);
}

LzView.prototype.setBlur = function(blur) {
    this.setFilter(new flash.filters.BlurFilter(blur, blur));
}

LzView.prototype.setFilter = function(filter) {
    var mc = this.getMCRef();
    if (!mc) return;
    var filters = [];
    filter && filters.push(filter);
    this.getMCRef().filters = filters;
}

LzNode.prototype.getClip = function() {
    this.getMCRef() || this.makeContainerResource();
    return this.getMCRef();
}

LzNode.prototype.show = function() {
    this.setVisible(true);
}

LzNode.prototype.hide = function() {
    this.setVisible(false);
}


/*
 * Iterators
 */

LzView.prototype.eachDirectInstance = function(klass, fn, thisObject) {
    this.subviews.forEach(function(e) {
        if (e instanceof klass)
            fn.call(thisObject, e);
    });
}

LzView.prototype.eachPath = function(klass, fn, thisObject) {
    this.subviews.forEach(function(e) {
        if (e instanceof klass)
            fn.call(thisObject, e);
        else
            e.eachPath(klass, fn, thisObject);
    });
}

LzView.prototype.eachSibling = function(fn, klass, thisObject) {
    var self = this;
    this.parent.subviews.forEach(function(e) {
        if (e != self && e instanceof klass)
            fn.call(thisObject, e);
    });
}


/*
 * Scrim
 */

// Return the bounds of view, clipped to container if present.
// (Container is not itself clipped.)
LzView.prototype.getAbsoluteBounds = function(container) {
    var view = this;
    var left = view.getAttributeRelative('x', canvas),
        top = view.getAttributeRelative('y', canvas),
        right = left + view.width,
        bottom = top + view.height;
    if (container) {
        var cb = container.getAbsoluteBounds();
        left = Math.max(left, cb.x);
        top = Math.max(top, cb.y);
        right = Math.min(right, cb.x + cb.width);
        bottom = Math.min(bottom, cb.y + cb.height);
    }
    return {x:left, y:top,
            width:right-left, height:bottom-top,
            right:right, bottom:bottom};
}

function createScrim(referenceView, options) {
    var parentView = canvas;
    options = arguments.length >= 2 ? options : {bgcolor:0};
    var container = options['container'] || canvas,
        round = options['round'] || 0,
        soft = options['soft'];
    var view = new LzView(parentView, {width:parentView.width,height:parentView.height,opacity:0});
    var bounds = referenceView.getAbsoluteBounds(container);
    if (soft && round) {
        bounds.x -= round;
        bounds.y -= round;
        bounds.width += 2*round;
        bounds.height += 2*round;
    }
    var left = bounds.x,
        right = bounds.x + bounds.width,
        top = bounds.y,
        bottom = bounds.y + bounds.height;
    var attributes = $H({}).merge(options);
    delete attributes.container;
    delete attributes.round;
    delete attributes.soft;
    function makeView(x, y, width, height) {
        new LzView(view, $H({x:x,y:y,width:width,height:height}).merge(attributes));
    }
    makeView(0, 0, canvas.width, top);
    makeView(0, top, left, bottom-top);
    makeView(right, top, parentView.width-right, bottom-top);
    makeView(0, bottom, parentView.width, parentView.height-bottom);
    if (round) {
        var v = new LzDrawView(view, {x:left,y:top,width:right-left,height:bottom-top});
        f.call(v);
        new LzDelegate(v, 'onmf', v, 'oninit');
    }
    canvas.eachDirectInstance(LzDebugWindow, invoke('bringToFront'));
    return view;

    function f(){
        if (!soft) {
            v.rect(0,0,v.width,v.height);
            v.rect(0,0,v.width,v.height,25);
            v.fill();
            return;
        }
        var r=round, w=r;
        // top, bottom
        gs(r,0,v.width-2*r,w,0,1);
        gs(r,v.height-w,v.width-2*r,w,0,-1);
        // left, right
        gs(0,r,w,v.height-2*w,1,0);
        gs(v.width-w,w,w,v.height-2*w,-1,0);
        // tl, tr, bl, br
        gss(0,0,w,w,-1,-1);
        gss(v.width-w,0,w,w,1,-1);
        gss(0,v.height-w,w,w,-1,1);
        gss(v.width-w,v.height-w,w,w,1,1);
    }
    function gs(x0,y0,w,h,gdx,gdy) {
        var gx0 = 0, gx1 = gdx;
        var gy0 = 0, gy1 = gdy;
        var x1 = x0 + w, y1 = y0 + h;
        if (gx1 < 0) {gx0 = 1; gx1 = 0}
        if (gy1 < 0) {gy0 = 1; gy1 = 0}
        v.beginPath();
        v.rect(x0,y0,w,h);
        grad(x0+w*gx0,y0+h*gy0,x0+w*gx1,y0+h*gy1);
        v.fill();
    }
    function gss(x0,y0,w,h,gdx,gdy) {
        var gx0 = -.5, gx1 = .5;
        var gy0 = -.5, gy1 = .5;
        var x1 = x0 + w, y1 = y0 + h;
        if (gdx < 0) {gx0 = 1; gx1 = 0}
        if (gdy < 0) {gy0 = 1; gy1 = 0}
        v.beginPath();
        v.rect(x0,y0,w,h);

        var g = v.createRadialGradient(x0+2*w*gx0,y0+2*h*gy0,10,x0+2*w*gx1,y0+2*h*gy1,100);

        v.globalAlpha = 0;
        g.addColorStop(0, 0x000000);
        v.globalAlpha = 1;
        g.addColorStop(1, 0);
        v.fillStyle = g;

        v.fill();
    }
    function grad(x0,y0,x1,y1) {
        var g = v.createLinearGradient(x0,y0,x1,y1)
        v.globalAlpha = 1;
        g.addColorStop(0, 0x000000);
        v.globalAlpha = 0;
        g.addColorStop(1, 0);
        v.fillStyle = g;
    }
}
