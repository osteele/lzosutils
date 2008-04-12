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
