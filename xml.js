/* Copyright 2007 by Oliver Steele.  All rights reserved. */

function XMLTraverse(xml, path) {
    var steps = path.split(' ');
    var nodes = [xml];
    Array.each(steps, function(step) {
        var results = [];
        Array.each(nodes, function(node) {
            Array.each(node.childNodes, function(child) {
                if (child.nodeType == 1 && child.nodeName == step)
                    results.push(child);
            });
        });
        nodes = results;
    });
    return nodes;
}

function xml2js(node) {
    if (node.nodeType == 3)
        return node.nodeValue;
    if (node.nodeType != 1)
        return undefined;
    var childElements = filter(
        function(c){return c.nodeType==1},
        node.childNodes);
    if (childElements.length) {
        var obj = {};
        Array.each(childElements, function(child) {
            var o = xml2js(child);
            var v = obj[child.nodeName];
            if (v) {
                if (v instanceof Array)
                    v.push(o);
                else
                    v = [v, o];
                o = v;
            }
            obj[child.nodeName] = o;
        });
        return obj;
    } else
        return map(function(c) {return c.nodeType==3 ? c.nodeValue : ""},
                   node.childNodes).join('');
}