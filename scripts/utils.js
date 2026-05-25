window.LifeTools = window.LifeTools || {};

window.LifeTools.Utils = (function() {
  'use strict';

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function createElement(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
          if (key === 'className') {
            el.className = attrs[key];
          } else if (key === 'style') {
            el.style.cssText = attrs[key];
          } else if (key.startsWith('on')) {
            el.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
          } else {
            el.setAttribute(key, attrs[key]);
          }
        }
      }
    }
    if (children) {
      if (typeof children === 'string') {
        el.innerHTML = children;
      } else if (Array.isArray(children)) {
        children.forEach(function(child) {
          if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
          } else if (child instanceof HTMLElement) {
            el.appendChild(child);
          }
        });
      }
    }
    return el;
  }

  return {
    escapeHtml: escapeHtml,
    createElement: createElement
  };
})();
