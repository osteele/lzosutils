/*
 * Nodes
 */

Array.destroyAll = function(items) {
    items.invoke('destroy');
}

LzNode.prototype.set = function(name, value) {
    if (arguments.length < 2) value = true;
    if (typeof name == 'object') {
        var hash = name;
        for (name in hash)
            this.setAttribute(name, hash[name]);
    } else
        this.setAttribute(name, value);
    return this;
}

LzNode.prototype.unset = function(name) {
    this.set(name, false);
    return this;
}

LzNode.prototype.to = function(name, value, duration, relative, rest) {
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
    this.parent.subviews.forEach(function(e) {
        if (e != this && e instanceof klass)
            fn.call(thisObject, e);
    });
}

/*
 * Scrim
 */

function getAbsoluteBounds(view, container) {
    var left = view.getAttributeRelative('x', canvas),
        top = view.getAttributeRelative('y', canvas),
        right = left + view.width,
        bottom = top + view.height;
    if (arguments.length >= 2) {
        var cb = getAbsoluteBounds(container);
        left = Math.max(left, cb.left);
        top = Math.max(top, cb.top);
        right = Math.min(right, cb.right);
        bottom = Math.min(bottom, cb.bottom);
    }
    return {left:left, top:top, right:right, bottom:bottom};
}

function createScrim(referenceView, options) {
    var parentView = canvas;
    options = arguments.length >= 2 ? options : {bgcolor:0};
    var container = options['container'] || canvas,
        round = options['round'] || 0,
        soft = options['soft'];
    var view = new LzView(parentView, {width:parentView.width,height:parentView.height,opacity:0});
    var bounds = getAbsoluteBounds(referenceView, container);
    if (soft && round) {
        bounds.left -= round;
        bounds.top -= round;
        bounds.right += round;
        bounds.bottom += round;
    }
    var left = bounds.left,
        right = bounds.right,
        top = bounds.top,
        bottom = bounds.bottom;
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
        function f(){
            if (!soft) {
                v.rect(0,0,v.width,v.height);
                v.rect(0,0,v.width,v.height,25);
                v.fill();
                return;
            }
            var r=round,w=25;
            // top, bottom
            gs(r,0,v.width-2*r,w,0,1);
            gs(r,v.height-w,v.width-2*r,w,0,-1);
            // left, right
            gs(0,r,w,v.height-2*w,1,0);
            gs(v.width-w,w,w,v.height-2*w,-1,0);
            // tl
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
            var gx0 = 0, gx1 = gdx;
            var gy0 = 0, gy1 = gdy;
            var x1 = x0 + w, y1 = y0 + h;
            if (gx1 < 0) {gx0 = 1; gx1 = 0}
            if (gy1 < 0) {gy0 = 1; gy1 = 0}
            v.beginPath();
            v.rect(x0,y0,w,h);

            //var g = v.createRadialGradient(x0+w*gx0,y0+h*gy0,0,x0+w*gx1,y0+h*gy1,10);
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
        f.call(v);
        new LzDelegate(v, 'onmf', v, 'oninit');
    }
    return view;
}
