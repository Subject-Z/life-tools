# 生活工具箱

## 架构优化说明

### 新架构特点

1. **配置化工具管理**：所有工具通过 `config/tools.js` 统一管理
2. **模块化目录结构**：每个工具独立位于 `tools/[tool-id]/` 目录
3. **核心系统分离**：核心功能和工具功能分离，便于维护和扩展
4. **动态渲染**：工具卡片从配置动态生成，无需修改HTML

### 项目结构

```
life-tools/
├── config/
│   └── tools.js          # 工具配置文件
├── scripts/
│   ├── core.js           # 核心系统
│   └── utils.js          # 工具函数
├── styles/
│   └── main.css          # 全局样式
├── tools/                # 工具目录
│   └── chapter-check/    # 章节序号检测工具
│       ├── index.html
│       ├── chapter-parser.js
│       └── chapter-check.js
└── index.html            # 首页
```

### 如何添加新工具

1. 在 `config/tools.js` 中添加工具配置：
```javascript
{
  id: 'your-tool-id',
  name: '工具名称',
  description: '工具描述',
  path: 'tools/your-tool-id/index.html',
  icon: '<svg>...</svg>',
  category: '分类名'
}
```

2. 在 `tools/` 目录下创建工具目录 `your-tool-id/`，并创建工具文件

3. 刷新首页即可看到新工具卡片

### 已实现功能

- 章节序号检测工具
- 动态工具卡片渲染
- 统一的工具管理系统
