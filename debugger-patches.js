// OpenLaszlo 3.4.* ships with a version of this that gives warnings!
function $reportUndefinedObjectProperty (filename, lineNumber, propertyName) {
#pragma "warnUndefinedReferences=false"
    if (filename == 'base/basewindow.lzx') return;
    if (! arguments.callee._dbg_recursive_call) {
        arguments.callee._dbg_recursive_call = true;
        $reportSourceWarning(filename, lineNumber, "undefined object does not have a property '" + propertyName + "'");
        arguments.callee._dbg_recursive_call = false;
    }
}

Debug.internalProperty = function(str) {
    var c = str.charAt(0);
    return c == '$' || c == '_';
}

Debug.inspectInternal = function (obj, showInternalProperties) {
#pragma "warnUndefinedReferences=false"
  var si = (typeof(showInternalProperties) != 'undefined')?showInternalProperties: this.showInternalProperties;
  var hasProto = (obj['__proto__']);
  var opl = this.printLength;

  // TODO: [2003-09-12 ptw] either bind or pass as option
  // Disable printLength for printing the name of a non-object in case
  // it was abbreviated, otherwise set it short
  if (! ((typeof(obj) == 'object') || (obj instanceof Object))) {
    this.printLength = Infinity;
  } else {
    this.printLength = this.inspect.printLength;
  }
  var name = this.xmlEscape(this.__String(obj));
  // Print properties with abbreviated length
  this.printLength = this.inspect.printLength;
  // Go into detail if showing internals
  if (si) {
    var enumerableSlots = [];
    // Accumulate list of enumerable slots before annotating
    for (var s in obj) {
      if ((! hasProto) || obj.hasOwnProperty(s)) {
        enumerableSlots.push(s);
      }
    }
    // N.B.: Flash-specific hack to get at otherwise unenumerable
    // properties.  This makes all properties enumerable.
    //
    // The first arg is the object to twiddle.  The second argument is
    // a list of slots to twiddle on, or null for all slots.
    // The 3rd arg is a bitmask:
    // 2^2 = writable
    // 2^1 = deletable
    // 2^0 = unenumerable
    // The 4th argument apparently is a bit-mask of the flags you want
    // to change (despite the rumors on the web)
    //
    // So, make all the properties of this object enumerable
    ASSetPropFlags(obj, null, 0, 1);
  }

  var keys = [];
  var arraylen = typeof(obj.length) == 'number' ? obj.length : null;
  if (si) {
    // print 'invisible' properties of MovieClip's
    if (obj instanceof MovieClip) {
      for (var p in {_x: 0, _y: 0, _visible: true, _xscale: 100,
                     _yscale: 100, _opacity: 100, _rotation: 0,
                     _currentframe: 1}) {
        keys.push(p);
      }
    }
  }
  for (var key in obj) {
    // Print only local slots
    if ((! hasProto) ||
        obj.hasOwnProperty(key) ||
        // attached movie clips don't show up as 'hasOwnProperty' (but
        // hasOwnProperty is more accurate -- consider if an instance
        // copies a prototype property)
        (obj[key] !== obj.__proto__[key]) ||
        // or getter slots (this is a heuristic -- there is no way to
        // ask if a property is a getter)
        (obj.__proto__.hasOwnProperty(key) &&
         (typeof(obj.__proto__[key]) == 'undefined'))
        ) {
      // Print array slots later, in order
      if (arraylen && (key >= 0) && (key < arraylen)) {
      } else if (si ||
                 ((! this.internalProperty(key)) &&
                  // Only show slots with internal type if showing
                  // internals
                  // ows
                  !(obj[key] instanceof LzEvent) &&
                  (! this.internalProperty(this.__typeof(obj[key]))))) {
        keys.push(key);
      }
    }
  }
  if (si) {
    // Reset the enumerability
    // Make everything unenumerable, and then expose your saved list
    ASSetPropFlags(obj, null, 1, 1);
    ASSetPropFlags(obj, enumerableSlots, 0, 1);
  }

  keys.sort(function (a, b) {
    var al = a.toLowerCase();
    var bl = b.toLowerCase();
    return (al > bl) - (al < bl);
  });
  var description = "";
  var kl = keys.length;
  var val;
  var wid = 0;
  // Align all keys if annotating 'weight'
  if (this.markGeneration > 0) {
    for (var i = 0; i < kl; i++) {
      var kil = keys[i].length;
      if (kil > wid) { wid = kil; }
    }
  }
  if (arraylen) {
    var kil = ('' + arraylen).length;
    if (kil > wid) { wid = kil; }
  }
  // indent
  wid = (wid + 2)
    // ows
    var collectionValues, collected = false;
    function flushRepeats() {
        if (collected)
            description += '  ' + collected.join(', ') + ': ' + collectionValues + '\n';
        collected = null;
    }
  for (var i = 0; i < kl; i++) {
    var key = keys[i];
    val = obj[key];
      // ows
      if (val == true || !val) {
          if (collected && val === collectionValues) {
              collected.push(key);
          } else {
              flushRepeats();
              collectionValues = val;
              collected = [key];
          }
      } else {
          flushRepeats();
          description += '  ' + this.computeSlotDescription(obj, key, val, wid);
      }
  }
    flushRepeats();

  if (arraylen) {
    for (var key = 0; key < arraylen; key++) {
      val = obj[key];
      // Skip non-existent elements, but don't bother with ellipses,
      // since we are displaying the key here
      if (typeof(val) != 'undefined') {
          // ows
        description += '  ' + this.computeSlotDescription(obj, key, val, wid);
      }
    }
  }

  this.printLength = opl;
  // Annotate 'weight' if available
  if (this.markGeneration > 0) {
    var leaked = this.annotation.leaked;
    if ((obj instanceof Object || obj instanceof MovieClip) &&
        (obj.hasOwnProperty instanceof Function) &&
        obj.hasOwnProperty(leaked) &&
        obj[leaked]) {
      name += ' (\u00A3' + obj[leaked] + ')';
    }
  }
  if (description != "") { description = ' {\n' + description + '}'; }
  return name + description;
}
