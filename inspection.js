/* Copyright 2007 by Oliver Steele.  All rights reserved. */

Debug.printChildren = function(node, indent) {
    indent = indent || '';
    var children = node['subviews'] || [];
    Debug.write(indent + node.toString() + (children.length ? ' {' : ''));
    Array.each(children, function(child) {
        Debug.printChildren(child, indent + '  ');
    });
    children.length && Debug.write(indent + '}');
}

