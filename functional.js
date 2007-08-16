Function.I = function(x) {return x};

function forEach(fn, ar, thisObject) {
    return ar.forEach(fn, thisObject);
}

function map(fn, ar, thisObject) {
    return ar.map(fn, thisObject);
}

function filter(fn, ar, thisObject) {
    return ar.filter(fn, thisObject);
}

var select = filter;

function pluck(name) {
    return function() {
        return this[name];
    }
}

function invoke(name, args) {
    args = [].slice.call(args, 0);
    return function(object) {
        return object[name].apply(object, args.concat([].slice.call(arguments, 0)));
    }
}
