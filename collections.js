/*
 * Array utilities
 */

Array.any = function(ar, fn) {
    for (var i = 0 ; i < ar.length; i++)
        if (fn(ar[i]))
            return true;
    return false;
}

Array.compact = function(ar) {
    var results = [];
    Array.each(ar, function(item) {
        item == null || item == undefined || results.push(item);
    });
    return results;
}

Array.detect = function(ar, fn) {
    for (var i = 0; i < ar.length; i++)
        if (fn(ar[i], i))
            return ar[i];
    return null;
}

Array.each = function(ar, fn, target) {
    for (var i = 0; i < ar.length; i++)
        fn.call(target, ar[i], i);
}

Array.find = function(ar, item) {
    for (var i = 0; i < ar.length; i++)
        if (ar[i] == item)
            return true;
    return false;
}

Array.index = function(ar, item) {
    for (var i = 0; i < ar.length; i++)
        if (ar[i] == item)
            return i;
    return null;
}

Array.invoke = function(ar, fname) {
    var result = new Array(ar.length);
    Array.each(ar, function(item, ix) {
        result[ix] = item[fname].apply(item);
    });
    return result;
}

Array.map = function(ar, fn) {
    var result = new Array(ar.length);
    Array.each(ar, function(item, ix) {
        result[ix] = fn(item, ix);
    });
    return result;
}

Array.pluck = function(ar, pname) {
    var result = new Array(ar.length);
    Array.each(ar, function(item, ix) {
        result[ix] = item[pname];
    });
    return result;
}

Array.select = function(ar, fn) {
    var result = [];
    Array.each(ar, function(item, ix) {
        if (fn(item, ix))
            result.push(item);
    });
    return result;
}

Array.sum = function(ar) {
    var sum = 0;
    Array.each(ar, function(n) {sum += n});
    return sum;
}

Array.without = function(ar, item) {
    return Array.select(ar, function(it) {
        return it != item;
    });
}


/*
 * JavaScript 1.6
 */

Array.prototype.indexOf = function(searchElement/*, fromIndex*/) {
    return Array.index(this, searchElement);
}

// lastIndexOf() - returns the index of the given item's last occurrence.

Array.prototype.every = function() {
}

Array.prototype.some = function(fn, thisObject) {
    return Array.any(this, fn, thisObject);
}

Array.prototype.filter = function() {
    return Array.select(this, fn, thisObject);
}

Array.prototype.forEach = function(fn, thisObject) {
    Array.each(this, fn, thisObject);
}

Array.prototype.map = function(fn, thisObject) {
    var len = this.length,
        result = new Array(len);
    for (var i = 0; i < len; i++)
        result[i] = fn.call(thisObject, this[i], i, this);
    return result;
}


/*
 * Hash utilities
 */

function $H(data) {
    return {
        keys: function() {return Hash.keys(data)}
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
        words.push([name, '=', LzBrowser.urlEscape(value)].join(''));
    }
    return words.length ? words.join('&') : '';
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

String.prototype.pluralize = function(count) {
    if (arguments.length && count == 1)
        return this;
    return this+'s';
}
