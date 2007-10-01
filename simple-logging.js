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

function info() {__debug_message('info', arguments); return arguments[0]}
function debug() {__debug_message('debug', arguments)}
function warn() {Debug.warn.apply(Debug, arguments)}
function error() {Debug.error.apply(Debug, arguments)}

if (false) {
    function info() {
        var expr = ['window.console && console.info && console.info(',
            JSON.stringify(arguments), ')'].join('');
        LzBrowser.loadJS(expr);
    }

    function error() {
        var expr = ['window.console && console.error && console.error(',
            JSON.stringify(arguments), ')'].join('');
        LzBrowser.loadJS(expr);
    }
}