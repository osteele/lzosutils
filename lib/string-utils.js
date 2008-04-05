/* Copyright 2007 by Oliver Steele.  All rights reserved. */

/*
 * String utilities
 */

String.prototype.capitalize = function() {
    return this.slice(0,1).toUpperCase() + this.slice(1);
}

String.prototype.escapeHTML = function() {
    return (this.replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'));
}

String.prototype.inflect = function(suffix) {
    var index = this.indexOf(' ');
    if (index >= 0)
        return this.slice(0, index).inflect(suffix) + this.slice(index);
    // pos == 'v', or vp has single word
    var inflections = {'ed': {'set': 'set'}};
    var key = this.toLowerCase();
    var value = (inflections[suffix]||{})[key];
    if (!value) {
        value = key;
        var lastChar = key.charAt(key.length-1);
        info(0, key);
        switch (lastChar) {
        case 'y':
            if (suffix == 'ed')
                value = value.slice(0, value.length-1) + 'i';
            break;
        case 'e':
            value = value.slice(0, value.length-1);
            break;
        }
        var vowels = "aeiou";
        if (key == value &&
            // CVC -> VCVV
            vowels.indexOf(value.charAt(value.length-1)) < 0 &&
            vowels.indexOf(value.charAt(value.length-2)) >= 0 &&
            vowels.indexOf(value.charAt(value.length-3)) < 0)
            value += value.charAt(value.length-1);
        value += suffix;
    }
    // TODO: capitalize
    return value;
}

String.prototype.pluralize = function(count) {
    if (arguments.length && count == 1)
        return this;
    return this+'s';
}

String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) == 0;
}

String.prototype.endsWith = function(suffix) {
    return this.lastIndexOf(suffix) == this.length - suffix.length;
}

String.prototype.strip = function() {
    var i, j, ws = " \t\n\r";
    for (j = this.length; --j >= 0 && ws.indexOf(this.charAt(j)) >= 0; )
        ;
    for (i = 0; i < j && ws.indexOf(this.charAt(i)) >= 0; i++)
        ;
    return 0 == i && j == this.length-1 ? this : this.slice(i, j+1);
}

String.prototype.truncate = function(length, ellipsis) {
    return (this.length <= length
            ? this
            : this.slice(0, length) + (ellipsis||''));
}
