function log() {
    var msg = Array.prototype.join.call(arguments, ' '),
        div = document.createElement('div');
    div.innerHTML = (msg.
                     replace(/&/g, '&amp;').
                     replace(/</g, '&lt;').
                     replace(/>/g, '&gt;').
                     replace('"', '&quote;'));
    document.getElementById('output').appendChild(div);
}

function logCall(fname, args) {
    var args = Array.prototype.slice.call(args, 0);
    args.unshift(fname);
    log.apply(null, args);
}

function traceFunction(path) {
    var target = window,
        properties = path.split('.');
    while (properties.length > 1)
        target = target[properties.shift()];
    var name = properties[0],
        fn = target[name];
    console.info('t', target, name);
    return target[name] = function() {
        logCall(path, arguments);
        return fn.apply(this, arguments);
    }
}

function traceMethods(path) {
    var target = window,
        properties = path.split('.');
    while (properties.length)
        target = target[properties.shift()];
    for (var name in target)
        traceFunction(path + '.' + name);
}