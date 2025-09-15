// 分组管理器
class GroupManager {
    constructor(tableManager) {
        this.tableManager = tableManager;
        this.currentGroup = null;
        this.originalData = [];
        this.groupedData = {};
        
        this.initializeElements();
        this.bindEvents();
    }

    // 初始化DOM元素
    initializeElements() {
        this.groupPanel = document.getElementById('groupPanel');
        this.groupField = document.getElementById('groupField');
        this.groupSort = document.getElementById('groupSort');
        this.applyGroupBtn = document.getElementById('applyGroup');
        this.clearGroupBtn = document.getElementById('clearGroup');
    }

    // 绑定事件
    bindEvents() {
        if (this.applyGroupBtn) {
            this.applyGroupBtn.addEventListener('click', () => this.applyGrouping());
        }

        if (this.clearGroupBtn) {
            this.clearGroupBtn.addEventListener('click', () => this.clearGrouping());
        }

        if (this.groupField) {
            this.groupField.addEventListener('change', () => this.updateGroupPreview());
        }

        if (this.groupSort) {
            this.groupSort.addEventListener('change', () => this.updateGroupPreview());
        }
    }

    // 显示分组面板
    showGroupPanel() {
        if (this.groupPanel) {
            this.groupPanel.style.display = 'block';
            this.updateFieldOptions();
        }
    }

    // 隐藏分组面板
    hideGroupPanel() {
        if (this.groupPanel) {
            this.groupPanel.style.display = 'none';
        }
    }

    // 更新字段选项
    updateFieldOptions() {
        if (!this.groupField) return;

        const columns = this.tableManager.getColumns();
        const fieldOptions = columns
            .filter(col => col.type !== 'image') // 排除图片字段
            .map(col => `<option value="${col.field}">${col.title}</option>`)
            .join('');

        this.groupField.innerHTML = '<option value="">请选择分组字段</option>' + fieldOptions;
    }

    // 更新分组预览
    updateGroupPreview() {
        const field = this.groupField?.value;
        if (!field) return;

        const data = this.originalData.length > 0 ? this.originalData : (this.tableManager.data || []);
        const groups = Utils.groupObjectArray(data, field);
        
        console.log('分组预览:', {
            field,
            groupCount: Object.keys(groups).length,
            groups: Object.keys(groups).map(key => ({
                name: key,
                count: groups[key].length
            }))
        });
    }

    // 应用分组
    applyGrouping() {
        const field = this.groupField?.value;
        const sort = this.groupSort?.value || 'asc';

        if (!field) {
            Utils.showNotification('请选择分组字段', 'warning', 2000);
            return;
        }

        // 保存原始数据
        const currentData = this.tableManager.data || [];
        if (Array.isArray(currentData) && this.originalData.length === 0) {
            this.originalData = [...currentData];
        }

        // 执行分组 - 简单排序实现
        this.currentGroup = { field, sort };
        
        const sortedData = [...this.originalData].sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sort === 'desc' ? bVal - aVal : aVal - bVal;
            }
            
            const comparison = String(aVal).localeCompare(String(bVal));
            return sort === 'desc' ? -comparison : comparison;
        });

        // 应用真正的分组
        this.applyRealGrouping(field, sort);
        
        const fieldTitle = this.getFieldTitle(field);
        Utils.showNotification(`已按 ${fieldTitle} 分组`, 'success', 2000);
    }

    // 构建分组后的记录
    buildGroupedRecords() {
        const records = [];
        const groupKeys = Object.keys(this.groupedData);
        
        // 排序分组键
        groupKeys.sort((a, b) => {
            if (this.currentGroup.sort === 'desc') {
                return b.localeCompare(a);
            }
            return a.localeCompare(b);
        });

        groupKeys.forEach(groupKey => {
            const groupRecords = this.groupedData[groupKey];
            
            // 添加分组头
            records.push(this.createGroupHeader(groupKey, groupRecords.length));
            
            // 添加分组数据
            groupRecords.forEach(record => {
                records.push({
                    ...record,
                    _isGroupItem: true,
                    _groupKey: groupKey
                });
            });
        });

        return records;
    }

    // 创建分组头
    createGroupHeader(groupName, count) {
        const columns = this.tableManager.getColumns();
        const header = {
            _isGroupHeader: true,
            _groupKey: groupName,
            _groupCount: count,
            _expanded: true
        };

        // 设置分组头显示内容
        columns.forEach((col, index) => {
            if (index === 0) {
                header[col.field] = `📁 ${groupName} (${count})`;
            } else {
                header[col.field] = '';
            }
        });

        return header;
    }

    // 更新表格显示分组
    updateTableWithGroups(records) {
        // 创建新的列配置，支持分组显示
        const columns = this.tableManager.buildVTableColumns().map(col => ({
            ...col,
            style: (args) => {
                const { record } = args;
                if (record._isGroupHeader) {
                    return {
                        bgColor: '#f1f5f9',
                        color: '#1e293b',
                        fontWeight: 'bold',
                        fontSize: 14
                    };
                } else if (record._isGroupItem) {
                    return {
                        bgColor: '#fefefe',
                        color: '#374151',
                        fontSize: 13,
                        paddingLeft: 20
                    };
                }
                return col.style;
            }
        }));

        // 更新表格
        this.tableManager.table.setOption({
            columns: columns,
            records: records
        });

        this.tableManager.updateRecordCount(this.originalData.length);
    }

    // 清除分组
    clearGrouping() {
        this.currentGroup = null;
        this.groupedData = {};

        if (this.originalData.length > 0) {
            // 恢复原始数据
            this.tableManager.data = [...this.originalData];
            this.tableManager.renderTable();
            this.originalData = [];
        }

        // 重置选择
        if (this.groupField) this.groupField.value = '';
        if (this.groupSort) this.groupSort.value = 'asc';

        Utils.showNotification('已清除分组', 'info', 2000);
    }

    // 切换分组展开/折叠
    toggleGroup(groupKey) {
        if (!this.groupedData[groupKey]) return;

        const records = this.tableManager.table.getRecords();
        const groupHeaderIndex = records.findIndex(r => 
            r._isGroupHeader && r._groupKey === groupKey
        );

        if (groupHeaderIndex === -1) return;

        const groupHeader = records[groupHeaderIndex];
        const isExpanded = groupHeader._expanded;

        // 更新展开状态
        groupHeader._expanded = !isExpanded;

        if (isExpanded) {
            // 折叠：隐藏分组项
            const itemsToHide = [];
            for (let i = groupHeaderIndex + 1; i < records.length; i++) {
                if (records[i]._isGroupHeader) break;
                if (records[i]._groupKey === groupKey) {
                    itemsToHide.push(i);
                }
            }
            
            // 从后往前删除，避免索引变化
            itemsToHide.reverse().forEach(index => {
                records.splice(index, 1);
            });
        } else {
            // 展开：显示分组项
            const groupItems = this.groupedData[groupKey].map(record => ({
                ...record,
                _isGroupItem: true,
                _groupKey: groupKey
            }));
            
            records.splice(groupHeaderIndex + 1, 0, ...groupItems);
        }

        // 更新分组头显示
        const count = this.groupedData[groupKey].length;
        const icon = groupHeader._expanded ? '📂' : '📁';
        const firstCol = this.tableManager.getColumns()[0];
        groupHeader[firstCol.field] = `${icon} ${groupKey} (${count})`;

        // 刷新表格
        this.tableManager.table.setRecords(records);
    }

    // 获取分组统计
    getGroupStats() {
        if (!this.currentGroup) {
            return {
                hasGroup: false,
                field: null,
                groupCount: 0,
                totalRecords: (this.tableManager.data || []).length
            };
        }

        return {
            hasGroup: true,
            field: this.currentGroup.field,
            sort: this.currentGroup.sort,
            groupCount: Object.keys(this.groupedData).length,
            totalRecords: this.originalData.length,
            groups: Object.keys(this.groupedData).map(key => ({
                name: key,
                count: this.groupedData[key].length
            }))
        };
    }

    // 按分组导出数据
    exportGroupedData() {
        if (!this.currentGroup) {
            Utils.showNotification('请先应用分组', 'warning', 2000);
            return;
        }

        const exportData = {
            groupField: this.currentGroup.field,
            groupSort: this.currentGroup.sort,
            groups: this.groupedData,
            stats: this.getGroupStats()
        };

        Utils.downloadFile(
            JSON.stringify(exportData, null, 2),
            'grouped_data.json',
            'application/json'
        );

        Utils.showNotification('分组数据导出成功', 'success', 2000);
    }

    // 导出分组摘要
    exportGroupSummary() {
        if (!this.currentGroup) {
            Utils.showNotification('请先应用分组', 'warning', 2000);
            return;
        }

        const summary = Object.keys(this.groupedData).map(groupKey => {
            const records = this.groupedData[groupKey];
            const columns = this.tableManager.getColumns();
            
            // 计算数值字段的统计信息
            const stats = {};
            columns.forEach(col => {
                if (col.type === 'number') {
                    const values = records.map(r => Number(r[col.field]) || 0);
                    stats[col.field] = {
                        sum: values.reduce((a, b) => a + b, 0),
                        avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
                        min: Math.min(...values),
                        max: Math.max(...values),
                        count: values.length
                    };
                }
            });

            return {
                group: groupKey,
                count: records.length,
                stats: stats
            };
        });

        Utils.downloadFile(
            JSON.stringify(summary, null, 2),
            'group_summary.json',
            'application/json'
        );

        Utils.showNotification('分组摘要导出成功', 'success', 2000);
    }

    // 重置分组管理器
    reset() {
        this.clearGrouping();
        this.originalData = [];
        this.groupedData = {};
    }

    // 获取当前分组配置
    getCurrentGroup() {
        return this.currentGroup;
    }

    // 设置分组配置
    setGroup(field, sort = 'asc') {
        if (this.groupField) this.groupField.value = field;
        if (this.groupSort) this.groupSort.value = sort;
        this.applyGrouping();
    }

    // 获取字段标题
    getFieldTitle(field) {
        const columns = this.tableManager.getColumns();
        const column = columns.find(col => col.field === field);
        return column ? column.title : field;
    }

    // 应用真正的分组到表格
    applyRealGrouping(field, sort) {
        if (!this.tableManager || !this.tableManager.data) return;

        this.currentGroup = { field, sort };
        this.groupStates = {}; // 存储分组展开状态

        // 按字段分组数据
        const groups = {};
        this.originalData.forEach((record, index) => {
            const value = record[field] || '未分组';
            if (!groups[value]) {
                groups[value] = [];
            }
            groups[value].push({ ...record, originalIndex: index });
        });

        // 排序分组
        const sortedGroups = Object.keys(groups).sort((a, b) => {
            if (sort === 'desc') {
                return b.localeCompare(a);
            }
            return a.localeCompare(b);
        });

        // 重新组织数据，默认展开所有分组
        this.groupedData = sortedGroups.map(groupValue => {
            this.groupStates[groupValue] = true; // 默认展开
            return {
                groupValue,
                records: groups[groupValue],
                expanded: true
            };
        });

        this.renderGroupedTable();
    }

    // 渲染分组表格
    renderGroupedTable() {
        if (!this.tableManager || !this.groupedData) return;

        const container = this.tableManager.container;
        if (!container) return;

        // 构建表头
        const thead = this.tableManager.columns.map(col => 
            `<th onclick="window.app.tableManager.sortByColumn('${col.field}')" style="cursor: pointer;">
                ${col.title}
                <i class="fas fa-sort" style="margin-left: 4px; opacity: 0.5;"></i>
            </th>`
        ).join('');

        // 构建分组内容
        const tbody = this.groupedData.map(group => {
            const groupHeader = `
                <tr class="group-header" onclick="window.app.groupManager.toggleGroup('${group.groupValue}')">
                    <td colspan="${this.tableManager.columns.length}" class="group-title">
                        <i class="fas fa-chevron-${group.expanded ? 'down' : 'right'}" style="margin-right: 8px;"></i>
                        <strong>${this.currentGroup.field}: ${group.groupValue}</strong>
                        <span class="group-count">(${group.records.length} 项)</span>
                    </td>
                </tr>
            `;

            let groupRows = '';
            if (group.expanded) {
                groupRows = group.records.map((record, index) => {
                    const cells = this.tableManager.columns.map(col => {
                        let value = record[col.field] || '';
                        let cellContent = this.tableManager.formatCellValue(value, col.type);
                        
                        const editable = col.editable ? 'editable-cell' : '';
                        const dataAttrs = `data-field="${col.field}" data-row="${record.originalIndex}" data-type="${col.type}"`;
                        
                        return `<td class="${editable}" ${dataAttrs}>${cellContent}</td>`;
                    }).join('');
                    
                    return `<tr class="group-row" data-row="${record.originalIndex}">${cells}</tr>`;
                }).join('');
            }

            return groupHeader + groupRows;
        }).join('');

        container.innerHTML = `
            <div class="simple-table-container">
                <table class="simple-table grouped-table">
                    <thead><tr>${thead}</tr></thead>
                    <tbody>${tbody}</tbody>
                </table>
            </div>
        `;

        // 重新绑定事件
        this.tableManager.bindEvents();
    }

    // 切换分组展开/收起
    toggleGroup(groupValue) {
        const group = this.groupedData.find(g => g.groupValue === groupValue);
        if (group) {
            group.expanded = !group.expanded;
            this.groupStates[groupValue] = group.expanded;
            this.renderGroupedTable();
        }
    }
}

// 导出分组管理器
window.GroupManager = GroupManager;