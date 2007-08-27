/*
 * Array utilities
 */

Array.prototype.compact = function() {
    var results = [];
    this.forEach(function(item) {
        item == null || item == undefined || results.push(item);
    });
    return results;
}

Array.prototype.detect = function(fn, thisObject) {
    for (var i = 0; i < this.length; i++)
        if (fn.call(thisObject, this[i], i, this))
            return this[i];
    return null;
}

Array.prototype.find = function(item) {
    for (var i = 0; i < this.length; i++)
        if (this[i] == item)
            return true;
    return false;
}

Array.prototype.contains = Array.prototype.find;

Array.prototype.invoke = function(name) {
    var result = new Array(this.length);
    var args = [].slice.call(arguments, 1);
    this.forEach(function(item, ix) {
        result[ix] = item[name].apply(item, args);
    });
    return result;
}

Array.prototype.pluck = function(name) {
    var result = new Array(this.length);
    this.forEach(function(item, ix) {
        result[ix] = item[name];
    });
    return result;
}

Array.prototype.select = function(fn, thisObject) {
    return this.filter(fn, thisObject);
}

Array.prototype.sum = function() {
    var sum = 0;
    this.forEach(function(n) {sum += n});
    return sum;
}

Array.prototype.without = function(item) {
    return this.filter(function(it) {
        return it != item;
    });
}

/*
 * Monadic Arrays
 */

Array.toList = function(ar) {
    return ar instanceof Array ? ar : [ar];
}

Array.fromList = function(ar) {
    return ar instanceof Array ? ar[0] : ar;
}

/*
 * JavaScript 1.6
 */

Array.prototype.indexOf = function(searchElement/*, fromIndex*/) {
    var len = this.length;
    for (var i = 0; i < len; i++)
        if (this[i] == searchElement)
            return i;
    return -1;
}

// lastIndexOf() - returns the index of the given item's last occurrence.

Array.prototype.every = function() {
    var len = this.length;
    for (var i = 0 ; i < len; i++)
        if (!fn.call(thisObject, this[i], i, this))
            return false;
    return true;
}

Array.prototype.some = function(fn, thisObject) {
    var len = this.length;
    for (var i = 0 ; i < len; i++)
        if (fn.call(thisObject, this[i], i, this))
            return true;
    return false;
}

Array.prototype.filter = function(fn, thisObject) {
    var len = this.length,
        results = [];
    for (var i = 0 ; i < len; i++)
        if (fn.call(thisObject, this[i], i, this))
            results.push(this[i]);
    return results;
}

Array.prototype.forEach = function(fn, thisObject) {
    var len = this.length;
    for (var i = 0 ; i < len; i++)
        if (typeof this[i] != 'undefined')
            fn.call(thisObject, this[i], i, this);
}

Array.prototype.map = function(fn, thisObject) {
    var len = this.length,
        result = new Array(len);
    for (var i = 0; i < len; i++)
        if (typeof this[i] != 'undefined')
            result[i] = fn.call(thisObject, this[i], i, this);
    return result;
}


/*
 * Prototype synonyms
 */

Array.prototype.each = Array.prototype.forEach;


/*
 * Hash utilities
 */

function $H(data) {
    return {
        each: function() {return Hash.each(data)},
        keys: function() {return Hash.keys(data)},
        merge: function(other) {return Hash.merge(data, other)},
        toQueryString: function() {return Hash.toQueryString(data)},
        values: function() {return Hash.values(data)}
    };
}

var Hash = {};

Hash.each = function(hash, fn) {
    for (var key in hash)
        fn(key, hash[key]);
}

Hash.keys = function(hash) {
    var keys = [];
    Hash.each(hash, function(key) {
        keys.push(key);
    });
    return keys;
}

Hash.merge = function(target, source) {
    for (var key in source)
        target[key] = source[key];
    return target;
}

Hash.toQueryString = function(hash) {
    var words = [];
    for (name in hash) {
        var value = hash[name];
        typeof value == 'function' ||
            words.push([name, '=', LzBrowser.urlEscape(value)].join(''));
    }
    words.sort();
    return words.join('&');
}

Hash.values = function(hash) {
    var values = [];
    Hash.each(hash, function(_, value) {
        values.push(value);
    });
    return values;
}


/*
 * String utilities
 */


String.prototype.escapeHTML = function() {
    return (this.replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'));
}

String.prototype.pluralize = function(count) {
    if (arguments.length && count == 1)
        return this;
    return this+'s';
}

// +pattern+ is required to be a string; there's therefore really no point in
// accepting a Function for +sub+.
String.prototype.replace = String.prototype['replace'] || function(pattern, sub) {
    var splits = this.split(pattern);
    var spans = new Array(splits.length*2-1);
    for (var i = 0, dst = 0; i < splits.length; i++) {
        i && (spans[dst++] = sub);
        spans[dst++] = splits[i];
    }
    return spans.join('');
}

String.prototype.strip = function() {
    var ws = " \t\n\r";
    for (j = this.length; --j >= 0 && ws.indexOf(this.charAt(j)) >= 0; )
        ;
    for (i = 0; i < j && ws.indexOf(this.charAt(i)) >= 0; i++)
        ;
    return 0 == i && j == this.length-1 ? this : this.slice(i, j+1);
}

String.prototype.truncate = function(length, ellipsis) {
    return (this.length <= length
            ? string
            : string.slice(0, length) + ellipsis);
}