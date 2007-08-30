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
    var childElements = node.childNodes.select(
        function(c){return c.nodeType==1});
    if (childElements.length) {
        var obj = {};
        childElements.forEach(function(child) {
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
        return node.childNodes.map(
            function(c) {return c.nodeType==3 ? c.nodeValue : ""}).join('');
}