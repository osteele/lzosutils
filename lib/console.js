/*
  Author: Oliver Steele
  Copyright: Copyright 2006 Oliver Steele.  All rights reserved.
  Download: http://osteele.com/sources/openlaszlo/simple-logging.js
  License: MIT License.

  This file defines +console.info+, +console.warn+, +console.error+, and
  +console.debug+ functions that are compatible with those defined by
  many HTTP user agents (for example, Firefox with Firebug; and Safari 3.0).
  This allows libraries that use these functions to be used in both
  OpenLaszlo programs and in browser JavaScript.

  This file also defines a function, +console.teeToBrowser+, that
  additionally routes the arguments to these functions to arguments
  with the same name in the browser JavaScript.  For example, after
  +console.teeToBrowsera()+ is called, +console.info('arg')+ will
  both write +'arg'+ to the OpenLaszlo Debug console (if the application
  is compiled with the debug switch), and invoke +console.info('arg')+
  within the browser.
*/

var console = {
    info: function() {Debug.write.apply(Debug, arguments); return arguments[0]},
    debug: function() {Debug.write.apply(Debug, ['debug'].concat(arguments))},
    warn: function() {Debug.warn(arguments.length > 1 ? arguments.join(', ') : arguments[0])},
    error: function() {Debug.error(arguments.length > 1 ? arguments.join(', ') : arguments[0])}
}

console.teeToBrowser = function(flag) {
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
        console[name] = function() {
            basis.apply(this, arguments);
            var argstrs = [];
            for (var i = 0; i < arguments.length; i++)
                argstrs.push(JSON.stringify(arguments[i]));
            var expr = [
                'window.console&&typeof ', reportfn, '=="function"&&',
                reportfn, '(', argstrs.join(','), ')'
            ].join('');
            LzBrowser.exec(expr);
        }
    }
}

// Execute javascript in the browser.  Throttled to avoid race
// condition with MSIE.
LzBrowser.exec = function(expr) {
    var nextTime = arguments.callee.nextTime || 0,
        now = (new Date).getTime();
    if (now < nextTime)
        return setTimeout(function(){LzBrowser.exec(expr)},
                          nextTime - now);
    _root.getURL('javascript:'+expr);
    arguments.callee.nextTime = now + 100;
}
