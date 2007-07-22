var forEach = Array.each;

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
    return function() {
        return this[name].apply(this, args.concat([].slice.call(arguments, 0)));
    }
}
