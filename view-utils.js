/*
 * Nodes
 */

Array.destroyAll = function(items) {
    for (var i in items)
        items[i].destroy();
}

LzNode.prototype.set = function(name, value) {
    if (arguments.length < 2) value = true;
    if (typeof name == 'object') {
        var hash = name;
        for (name in hash)
            this.setAttribute(name, hash[name]);
    } else
        this.setAttribute(name, value);
}

LzNode.prototype.unset = function(name) {
    this.set(name, false);
}

LzNode.prototype.to = function(name, value, duration, relative, rest) {
    if (typeof name == 'object') {
        var hash = name;
        for (name in hash)
            // shifted by one
            this.animate(name, hash[name], value, duration, relative);
        return;
    }
    var durationNames = {slow: 600, normal: 400, fast: 200};
    if (arguments.length < 3)
        duration = 'normal';
    if (durationNames[duration])
        duration = durationNames[duration];
    this.animate(name, value, duration, relative, rest);
}

LzNode.prototype.animators = function(hash, duration) {
    var self = this;
    Hash.each(hash, function(name, value) {
        self.animate(name, value, duration);
    });
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

LzView.prototype.setFilter = function(filter) {
    var filters = [];
    filter && filters.push(filter);
    this.getMCRef().filters = filters;
}

LzNode.prototype.show = function() {
    this.setVisible(true);
}

LzNode.prototype.hide = function() {
    this.setVisible(false);
}

LzNode.prototype.toggle = function(name) {
    if (!arguments.length) name = 'visible';
    this.set(name, !this[name]);
}


/*
 * Iterators
 */

LzView.prototype.eachDirectInstance = function(klass, fn) {
    this.subviews.forEach(function(e) {
        if (e instanceof klass)
            fn(e);
    });
}

LzView.prototype.eachPath = function(klass, fn) {
    this.subviews.forEach(function(e) {
        if (e instanceof klass)
            fn(e);
        else
            e.eachPath(klass, fn);
    });
}

LzView.prototype.eachSibling = function(fn, klass) {
    this.parent.subviews.forEach(function(e) {
        if (e != this && e instanceof klass)
            fn(e);
    });
}