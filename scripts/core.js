window.LifeTools = window.LifeTools || {};

window.LifeTools.Core = (function() {
  'use strict';

  function getTools() {
    return window.LifeTools.config.tools || [];
  }

  function getToolById(id) {
    return getTools().find(function(tool) {
      return tool.id === id;
    });
  }

  function renderToolCard(tool) {
    return '<a href="' + tool.path + '">' +
      '<div class="card tool-card">' +
        '<div class="tool-icon">' + tool.icon + '</div>' +
        '<h3>' + tool.name + '</h3>' +
        '<p>' + tool.description + '</p>' +
        '<span class="tool-arrow">进入 &#8594;</span>' +
      '</div>' +
    '</a>';
  }

  function renderToolGrid(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var tools = getTools();
    var html = tools.map(renderToolCard).join('');
    container.innerHTML = html;
  }

  return {
    getTools: getTools,
    getToolById: getToolById,
    renderToolGrid: renderToolGrid
  };
})();
