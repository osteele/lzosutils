/*
  Author: Oliver Steele
  Copyright: Copyright 2006 Oliver Steele.  All rights reserved.
  Download: http://osteele.com/sources/openlaszlo/simple-logging.js
  License: MIT License.

  This file defines +info+, +warn+, +error+, and +debug+ functions
  that are compatible with those defined in
  {readable.js}[http://osteele.com/sources/javascript/readable.js],
  {inline-console.js}[http://osteele.com/sources/javascript/inline-console.js],
  and fvlogger[http://www.alistapart.com/articles/jslogging].  This
  allows libraries that use these functions to be used in both
  OpenLaszlo programs and in DHTML.
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
        // fn call to create new bindings
        install(names[i]);
    function install(name) {
        var basis = console[name],
            reporter = 'console.' + name;
        console[name] = around;
        function around() {
            basis.apply(this, arguments);
            var expr = ['window.console&&', reporter, '&&',
                reporter, '(', JSON.stringify(arguments), ')'].join('');
            LzBrowser.loadJS(expr);
        }
    }
}
