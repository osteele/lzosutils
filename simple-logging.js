/*
  Author: Oliver Steele
  Copyright: Copyright 2006 Oliver Steele.  All rights reserved.
  Download: http://osteele.com/sources/openlaszlo/simple-logging.js
  License: MIT License.

  This file defines +console.info+, +console.warn+, +console.error+, and
  +console.debug+ functions that are compatible with those define by
  many HTTP user agents (for example, Firefox with Firebug; and Safari 3.0).
  This allows libraries that use these functions to be used in both
  OpenLaszlo programs and in browser JavaScript.

  This file also defines a function, +console.toBrowserConsole+, that
  additionally routes the arguments to these functions to arguments
  with the same name in the browser JavaScript.  For example, after
  +console.toBrowserConsole()+ is called, +console.info('arg')+ will
  both write +'arg'+ to the OpenLaszlo Debug console (if the application
  is compiled with the debug switch), and invoke +console.info('arg')+

*/

function __debug_message(level, args) {
    Debug.write.apply(Debug, [level].concat(args));
}

var console = {
    info: function() {__debug_message('info', arguments); return arguments[0]},
    debug: function() {__debug_message('debug', arguments)},
    warn: function() {Debug.warn.apply(Debug, arguments)},
    error: function() {Debug.error.apply(Debug, arguments)}
}

console.toBrowserConsole = function(flag) {
    var options = arguments.callee;
    flag = Boolean(flag == undefined ? true : flag);
    if (options['installed'] == flag)
        return;
    options.installed = flag;
    var names = ['info', 'debug', 'warn', 'error'];
    for (var i = 0; i < names.length; i++)
        install(names[i]);
    // use an fn to create a new binding for each iteration
    function install(name) {
        var basis = console[name],
            reportfn = 'console.' + name;
        console[name] = around;
        function around() {
            basis.apply(this, arguments);
            var argstrs = [];
            for (var i = 0; i < arguments.length; i++)
                argstrs.push(JSON.stringify(arguments[i]));
            var expr = [
                'javascript:window.console&&typeof ', reportfn, '=="function"&&',
                reportfn, '(', argstrs.join(','), ')'
            ].join('');
            getURL(expr);
        }
    }
    var nextTime = 0;
    function getURL(expr) {
        var now = (new Date).getTime();
        if (now < nextTime)
            return setTimeout(function(){_root.getURL(expr)}, nextTime - now);
        nextTime = now + 1000;
    }
}
