import { toolsConfig } from '../config/tools.js';

export const getTools = () => toolsConfig.tools || [];

export const getToolById = (id) => getTools().find(tool => tool.id === id);

export const renderToolCard = (tool) => `
  <a href="${tool.path}">
    <div class="card tool-card">
      <div class="tool-icon">${tool.icon}</div>
      <h3>${tool.name}</h3>
      <p>${tool.description}</p>
      <span class="tool-arrow">进入 →</span>
    </div>
  </a>`;

export const renderToolGrid = (containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = getTools().map(renderToolCard).join('');
};
