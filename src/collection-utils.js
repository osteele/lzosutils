/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

/*
 * JavaScript 1.6 Array extensions
 */

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

Array.prototype.indexOf = function(searchElement/*, fromIndex*/) {
    var len = this.length;
    for (var i = 0; i < len; i++)
        if (this[i] == searchElement)
            return i;
    return -1;
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
 * Prototype Array extensions
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

Array.prototype.each = Array.prototype.forEach;

Array.prototype.find = function(item) {
    for (var i = 0; i < this.length; i++)
        if (this[i] == item)
            return true;
    return false;
}

Array.prototype.contains = Array.prototype.find;

Array.prototype.invoke = function(name) {
    var result = new Array(this.length);
    var args = Array.slice(arguments, 1);
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
 * Other array extensions
 */

Array.slice = (function() {
    var slice = Array.prototype.slice;
    return function(array) {
        return slice.apply(array, slice.call(arguments, 1));
    }
})();

Array.prototype.commas = function() {
    return this.join(',');
}

Array.prototype.last = function() {
    var length = this.length;
    return length ? this[length-1] : null;
}

Array.toArray = function(array) {
    return array instanceof Array ? array : [array];
}

Array.fromArray = function(array) {
    return array instanceof Array ? array[0] : array;
}


/*
 * Prototype Hash utilities
 */

var Hash = {};

function $H(properties) {
    // this is (a lot) less efficient but more maintainable than just
    // returning {each:function(){return Hash.each(p)}, ...}
    var hash = {},
        dummy = {},
        unshift = Array.prototype.unshift;
    for (var name in Hash)
        dummy[name] || addMethod(name);
    return hash;
    function addMethod(name) {
        var fn = Hash[name];
        hash[name] = function() {
            unshift.call(arguments, properties);
            return fn.apply(Hash, arguments);
        }
    }
}

Hash.each = function(hash, fn) {
    var ix = 0;
    for (var key in hash)
        fn({key:key, value:hash[key]}, ix++);
}

Hash.keys = function(hash) {
    var keys = [];
    for (var key in hash)
        keys.push(key);
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
    for (var key in hash)
        values.push(hash[key]);
    return values;
}


/*
 * Other Hash extensions
 */

Hash.compact = function(hash) {
    var result = {};
    for (var name in hash) {
        var value = hash[name];
        if (value != null && value != undefined)
            result[name] = value;
    }
    return result;
}

Hash.items = function(hash) {
    var result = [];
    for (var key in hash)
        result.push({key:key, value:hash[key]});
    return result;
}
