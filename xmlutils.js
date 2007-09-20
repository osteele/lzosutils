/* Copyright 2007 by Oliver Steele.  All rights reserved. */

function XMLTraverse(xml, path) {
    if (xml instanceof Array)
        return xml.forEach(function(item) {return XMLTraverse(item, path)});
    var steps = path.split(' ');
    var nodes = [xml];
    steps.forEach(function(step) {
        var results = [];
        nodes.forEach(function(node) {
            node.childNodes.forEach(function(child) {
                if (child.nodeType == 1 && (step == '*' || child.nodeName == step))
                    results.push(child);
            });
        });
        nodes = results;
    });
    return nodes;
}

function xml2js(node) {
    if (node instanceof Array)
        return node.map(xml2js);
    if (node.nodeType == 3)
        return node.nodeValue;
    if (node.nodeType != 1)
        return undefined;
    var childNodes = node.childNodes,
        childNodeCount = childNodes.length,
        obj = {},
        found = 0;
    // inlining this loop is up to 50% faster
    for (var i = 0; i < childNodeCount; i++) {
        var child = childNodes[i];
        if (child.nodeType != 1)
            continue;
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
        found = true;
    }
    if (found)
        return obj;
    else if (childNodeCount == 1) {
        // this special case is up to 50% faster
        var c = childNodes[0];
        return c.nodeType==3 ? c.nodeValue : '';
    } else
        // unrolling this doesn't help
        return childNodes.map(
            function(c) {return c.nodeType==3 ? c.nodeValue : ""}).join('');
}