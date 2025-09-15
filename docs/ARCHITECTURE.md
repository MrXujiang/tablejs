## 架构与模块交互

本文件详细说明应用的运行时架构、模块职责、交互流程与关键数据结构，帮助二次开发者快速理解整体设计。

### 1. 顶层结构
- `index.html`：入口与 DOM 容器、工具栏、侧边栏（筛选/分组）、模态框（上传/新增列）、右键菜单。
- `js/app.js`：应用协调器 `App`。负责：
  - 生命周期：初始化 → 绑定事件 → 恢复状态 → 就绪通知
  - 管理器 orchestration：`TableManager | SimpleTableManager`、`FilterManager`、`GroupManager`、`ImageManager`
  - 快捷键、导出对话框、保存/加载、本地存储的状态恢复

### 2. 表格子系统
应用提供两种实现，运行时择一：

1) 增强模式：`TableManager`（依赖 VTable）
- 负责列/数据的初始化、VTable 配置（主题、编辑器、事件）、右键菜单、排序/选择/编辑/导出。
- 关键方法：
  - `initializeTable()/initializeFallbackTable()`
  - `buildVTableColumns()/getEditor()`
  - `handleCellContextMenu()/editCell()/copyCell()/pasteCell()`
  - `addRow()/addColumn()/deleteSelectedRows()`
  - `saveData()/loadData()/exportData()`

2) 降级模式：`SimpleTableManager`（纯 HTML 表格）
- 渲染 `thead/tbody` 字符串并一次性注入，支持编辑、排序、列宽拖拽、勾选多选、导出、生成测试数据。
- 关键方法：
  - `renderTable()/formatCellValue()/startCellEdit()/finishCellEdit()`
  - `bindColumnResizeEvents()/bindMultiSelectEvents()`
  - `filterData()/clearFilter()/sortByColumn()`
  - `generateTestData()/exportToCSV()/exportToJSON()`

统一接口思想：两种实现都提供 `getData()/getColumns()/addColumn()/deleteSelectedRows()/exportData()` 等方法，便于其他管理器无感知调用。

### 3. 功能管理器
- `FilterManager`：
  - DOM：`#filterPanel`，动态插入条件项（字段/操作符/值）。
  - 逻辑：更新字段/操作符、采集条件、调用 `tableManager.filterData(filters)`，导入导出条件、统计与重置。
  - 扩展点：`getOperatorOptions()` 与 `Utils.filterObjectArray()`。

- `GroupManager`：
  - DOM：`#groupPanel #groupField #groupSort`，支持预览、应用与清除。
  - VTable 模式：通过 `table.setOption` 自定义行样式（分组头/项）。
  - 简化模式：`renderGroupedTable()` 以分组头行 + 组内数据行渲染，支持展开/收起与统计导出。
  - 扩展点：`exportGroupSummary()` 聚合数值字段、`applyRealGrouping()` 自定义组装。

- `ImageManager`：
  - DOM：上传区域、预览图、确认按钮。
  - 逻辑：大小/类型校验、Canvas 压缩、Base64 预览并写回目标单元格与数据源；可扩展为上传服务器获得 URL。

- `MultiSelectManager`：
  - 框选/多选（Ctrl/Cmd 或 Shift）、选区可视化与数量提示。
  - 批量操作：清空/复制选区；可扩展粘贴/设值。

- `Utils`：
  - 通用：通知、模态、右键菜单、下载、日期/大小格式化、复制、存储、图片处理、防抖/节流。

### 4. 事件与数据流
1) 用户在工具栏点击“筛选” → `App.toggleSidebar()` → `FilterManager.showFilterPanel()`。
2) 新增条件时从 `tableManager.getColumns()` 获取字段列表；点击“应用”后 `FilterManager.applyFilters()` → `tableManager.filterData(filters)`。
3) 分组类似：`GroupManager.applyGrouping()` 基于当前数据生成分组结构并渲染；清除恢复原始数据。
4) 右键菜单（表格层面）由各表格管理器触发，菜单项调用对应数据写入方法并 `saveData()`。
5) `App.saveData()` 除表格数据外还保存筛选/分组状态，`App.loadSavedData()` 延时恢复 UI。

### 5. 关键数据结构
- 列定义（示例）：
```js
{
  field: 'department',
  title: '部门',
  width: 120,
  type: 'select',
  editable: true, // simple 模式
  editor: 'select', // vtable 模式
  options: ['技术部','产品部','设计部']
}
```

- 筛选条件：`{ field: string, operator: string, value: string | number | date }[]`

- 分组状态：`{ field: string, sort: 'asc' | 'desc' } | null`

### 6. 降级策略与一致性
- 简化模式尽量复用与增强模式一致的接口与行为（方法命名、导出格式、通知反馈）。
- 差异点：
  - VTable 专有事件/编辑器在简化模式用原生控件代替。
  - 分组在简化模式以静态行结构体现分组头，不复用 VTable 的样式钩子。

### 7. 性能与可维护性
- 批量渲染：HTML 字符串拼接后整体注入，减少多次 DOM 操作。
- 资源可选：CDN 失败自动降级，保障可用性。
- 模块内聚：图片、筛选、分组、表格、多选分别抽象，降低耦合。


