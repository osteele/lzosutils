Function.I = function(x) {return x};

function forEach(fn, ar, context) {
    return Array.each(ar, fn, context);
}

function map(fn, ar, context) {
    return Array.map(ar, fn, context);
}

function filter(fn, ar, context) {
    return Array.select(ar, fn, context);
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
