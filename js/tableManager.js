// 表格管理器
class TableManager {
    constructor(container) {
        this.container = container;
        this.table = null;
        this.data = [];
        this.columns = [];
        this.selectedRows = new Set();
        this.clipboard = null;
        this.currentCell = null;
        
        this.initializeDefaultData();
        this.initializeTable();
        this.bindEvents();
    }

    // 初始化默认数据
    initializeDefaultData() {
        this.columns = [
            {
                field: 'id',
                title: 'ID',
                width: 80,
                type: 'number',
                sort: true
            },
            {
                field: 'name',
                title: '姓名',
                width: 120,
                type: 'text',
                sort: true,
                editor: 'input'
            },
            {
                field: 'age',
                title: '年龄',
                width: 80,
                type: 'number',
                sort: true,
                editor: 'input'
            },
            {
                field: 'email',
                title: '邮箱',
                width: 200,
                type: 'text',
                sort: true,
                editor: 'input'
            },
            {
                field: 'department',
                title: '部门',
                width: 120,
                type: 'select',
                sort: true,
                editor: 'select',
                options: ['技术部', '产品部', '设计部', '运营部', '市场部']
            },
            {
                field: 'joinDate',
                title: '入职日期',
                width: 120,
                type: 'date',
                sort: true,
                editor: 'date'
            },
            {
                field: 'avatar',
                title: '头像',
                width: 100,
                type: 'image',
                editor: 'image'
            },
            {
                field: 'status',
                title: '状态',
                width: 100,
                type: 'select',
                sort: true,
                editor: 'select',
                options: ['在职', '离职', '休假']
            }
        ];

        this.data = [
            {
                id: 1,
                name: '张三',
                age: 28,
                email: 'zhangsan@example.com',
                department: '技术部',
                joinDate: '2023-01-15',
                avatar: '',
                status: '在职'
            },
            {
                id: 2,
                name: '李四',
                age: 32,
                email: 'lisi@example.com',
                department: '产品部',
                joinDate: '2022-08-20',
                avatar: '',
                status: '在职'
            },
            {
                id: 3,
                name: '王五',
                age: 26,
                email: 'wangwu@example.com',
                department: '设计部',
                joinDate: '2023-03-10',
                avatar: '',
                status: '在职'
            },
            {
                id: 4,
                name: '赵六',
                age: 30,
                email: 'zhaoliu@example.com',
                department: '运营部',
                joinDate: '2022-12-05',
                avatar: '',
                status: '休假'
            },
            {
                id: 5,
                name: '钱七',
                age: 29,
                email: 'qianqi@example.com',
                department: '市场部',
                joinDate: '2023-02-28',
                avatar: '',
                status: '在职'
            }
        ];
    }

    // 初始化表格
    initializeTable() {
        // 检查 VTable 是否可用
        if (typeof VTable === 'undefined') {
            console.error('VTable 未加载，使用备用表格');
            this.initializeFallbackTable();
            return;
        }

        try {
            const option = {
                container: this.container,
                columns: this.buildVTableColumns(),
                records: this.data,
                widthMode: 'standard',
                heightMode: 'autoHeight',
                autoWrapText: true,
                hover: {
                    highlightMode: 'row'
                },
                select: {
                    highlightMode: 'row'
                },
                theme: this.getTableTheme()
            };

            this.table = new VTable.ListTable(option);
            this.bindTableEvents();
            this.updateRecordCount();
            
            // 隐藏加载状态
            Utils.hideLoading(this.container.parentElement);
            
        } catch (error) {
            console.error('VTable 初始化失败:', error);
            this.initializeFallbackTable();
        }
    }

    // 备用表格实现
    initializeFallbackTable() {
        console.log('使用备用HTML表格实现');
        
        // 创建HTML表格
        const tableHtml = this.createHtmlTable();
        this.container.innerHTML = tableHtml;
        
        // 绑定HTML表格事件
        this.bindHtmlTableEvents();
        this.updateRecordCount();
        
        // 隐藏加载状态
        Utils.hideLoading(this.container.parentElement);
        
        Utils.showNotification('已切换到备用表格模式', 'warning', 3000);
    }

    // 创建HTML表格
    createHtmlTable() {
        const thead = this.columns.map(col => 
            `<th data-field="${col.field}" style="width: ${col.width}px">${col.title}</th>`
        ).join('');
        
        const tbody = this.data.map((record, rowIndex) => {
            const cells = this.columns.map(col => {
                let value = record[col.field] || '';
                if (col.type === 'image' && value) {
                    value = `<img src="${value}" alt="图片" style="max-width: 60px; max-height: 40px; object-fit: cover;">`;
                }
                return `<td data-field="${col.field}" data-row="${rowIndex}" contenteditable="${col.editor ? 'true' : 'false'}">${value}</td>`;
            }).join('');
            return `<tr data-row="${rowIndex}">${cells}</tr>`;
        }).join('');

        return `
            <div class="fallback-table-container">
                <table class="fallback-table">
                    <thead>
                        <tr>${thead}</tr>
                    </thead>
                    <tbody>${tbody}</tbody>
                </table>
            </div>
        `;
    }

    // 绑定HTML表格事件
    bindHtmlTableEvents() {
        const table = this.container.querySelector('.fallback-table');
        if (!table) return;

        // 单元格编辑事件
        table.addEventListener('blur', (e) => {
            if (e.target.tagName === 'TD' && e.target.contentEditable === 'true') {
                const field = e.target.dataset.field;
                const row = parseInt(e.target.dataset.row);
                const value = e.target.textContent.trim();
                
                if (this.data[row] && field) {
                    this.data[row][field] = value;
                    this.saveData();
                }
            }
        }, true);

        // 右键菜单
        table.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'TD') {
                e.preventDefault();
                const row = parseInt(e.target.dataset.row);
                const field = e.target.dataset.field;
                const col = this.columns.findIndex(c => c.field === field);
                
                this.handleCellContextMenu({
                    event: e,
                    row: row,
                    col: col
                });
            }
        });
    }

    // 构建VTable列配置
    buildVTableColumns() {
        return this.columns.map(col => {
            const column = {
                field: col.field,
                title: col.title,
                width: col.width,
                sort: col.sort || false,
                headerStyle: {
                    bgColor: '#f8fafc',
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: 13,
                    borderColor: '#e2e8f0'
                },
                style: {
                    color: '#1e293b',
                    fontSize: 13,
                    borderColor: '#e2e8f0'
                }
            };

            // 根据类型设置特殊配置
            switch (col.type) {
                case 'image':
                    column.cellType = 'image';
                    column.keepAspectRatio = true;
                    column.imageAutoSizing = true;
                    break;
                case 'date':
                    column.format = (value) => {
                        return value ? Utils.formatDate(value) : '';
                    };
                    break;
                case 'number':
                    column.format = (value) => {
                        return typeof value === 'number' ? value.toString() : value;
                    };
                    break;
            }

            // 设置编辑器
            if (col.editor) {
                column.editor = this.getEditor(col);
            }

            return column;
        });
    }

    // 获取编辑器配置
    getEditor(column) {
        switch (column.editor) {
            case 'input':
                return {
                    type: 'input',
                    editorConfig: {
                        type: column.type === 'number' ? 'number' : 'text'
                    }
                };
            case 'select':
                return {
                    type: 'list',
                    editorConfig: {
                        values: column.options || []
                    }
                };
            case 'date':
                return {
                    type: 'date',
                    editorConfig: {
                        format: 'YYYY-MM-DD'
                    }
                };
            case 'image':
                return {
                    type: 'input',
                    editorConfig: {
                        type: 'text',
                        placeholder: '点击上传图片'
                    }
                };
            default:
                return null;
        }
    }

    // 获取表格主题
    getTableTheme() {
        return {
            defaultStyle: {
                borderLineWidth: 1,
                borderColor: '#e2e8f0',
                color: '#1e293b',
                fontSize: 13,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            },
            headerStyle: {
                bgColor: '#f8fafc',
                color: '#1e293b',
                fontWeight: 600,
                borderColor: '#e2e8f0'
            },
            rowHoverStyle: {
                bgColor: '#f8fafc'
            },
            selectionStyle: {
                bgColor: 'rgba(37, 99, 235, 0.1)',
                borderColor: '#2563eb'
            }
        };
    }

    // 获取右键菜单项
    getContextMenuItems() {
        return [
            {
                text: '编辑',
                icon: 'edit',
                handler: (args) => this.editCell(args)
            },
            {
                text: '复制',
                icon: 'copy',
                handler: (args) => this.copyCell(args)
            },
            {
                text: '粘贴',
                icon: 'paste',
                handler: (args) => this.pasteCell(args)
            },
            'separator',
            {
                text: '插入行',
                icon: 'plus',
                handler: (args) => this.insertRow(args)
            },
            {
                text: '删除行',
                icon: 'trash',
                handler: (args) => this.deleteRow(args)
            },
            'separator',
            {
                text: '上传图片',
                icon: 'image',
                handler: (args) => this.uploadImage(args)
            }
        ];
    }

    // 绑定表格事件
    bindTableEvents() {
        // 单元格点击事件
        this.table.on('click_cell', (args) => {
            this.currentCell = args;
            this.handleCellClick(args);
        });

        // 单元格双击事件
        this.table.on('dblclick_cell', (args) => {
            this.editCell(args);
        });

        // 单元格右键事件
        this.table.on('contextmenu_cell', (args) => {
            this.handleCellContextMenu(args);
        });

        // 行选择事件
        this.table.on('select_cell', (args) => {
            this.handleRowSelect(args);
        });

        // 编辑完成事件
        this.table.on('change_cell_value', (args) => {
            this.handleCellValueChange(args);
        });

        // 列拖拽事件
        this.table.on('drag_select_end', (args) => {
            this.handleColumnDrag(args);
        });

        // 排序事件
        this.table.on('sort_click', (args) => {
            this.handleSort(args);
        });
    }

    // 绑定外部事件
    bindEvents() {
        // 点击空白处隐藏右键菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                Utils.hideContextMenu();
            }
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });
    }

    // 处理单元格点击
    handleCellClick(args) {
        const { col, row } = args;
        const column = this.columns[col];
        
        if (column && column.type === 'image') {
            const record = this.data[row];
            if (record && record[column.field]) {
                this.showImagePreview(record[column.field]);
            } else {
                this.uploadImage(args);
            }
        }
    }

    // 处理单元格右键菜单
    handleCellContextMenu(args) {
        const { event } = args;
        event.preventDefault();
        
        const menuItems = [
            {
                text: '编辑',
                icon: 'fas fa-edit',
                action: 'edit',
                handler: () => this.editCell(args)
            },
            {
                text: '复制',
                icon: 'fas fa-copy',
                action: 'copy',
                handler: () => this.copyCell(args)
            },
            {
                text: '粘贴',
                icon: 'fas fa-paste',
                action: 'paste',
                handler: () => this.pasteCell(args)
            },
            { divider: true },
            {
                text: '插入行',
                icon: 'fas fa-plus',
                action: 'insertRow',
                handler: () => this.insertRow(args)
            },
            {
                text: '删除行',
                icon: 'fas fa-trash',
                action: 'deleteRow',
                handler: () => this.deleteRow(args)
            }
        ];

        const column = this.columns[args.col];
        if (column && column.type === 'image') {
            menuItems.push(
                { divider: true },
                {
                    text: '上传图片',
                    icon: 'fas fa-image',
                    action: 'uploadImage',
                    handler: () => this.uploadImage(args)
                }
            );
        }

        Utils.showContextMenu(args.event.clientX, args.event.clientY, menuItems);
    }

    // 处理行选择
    handleRowSelect(args) {
        const { row } = args;
        if (this.selectedRows.has(row)) {
            this.selectedRows.delete(row);
        } else {
            this.selectedRows.add(row);
        }
        this.updateSelectedCount();
    }

    // 处理单元格值变化
    handleCellValueChange(args) {
        const { col, row, value } = args;
        const column = this.columns[col];
        
        if (column && this.data[row]) {
            this.data[row][column.field] = value;
            this.saveData();
            Utils.showNotification('数据已更新', 'success', 2000);
        }
    }

    // 处理列拖拽
    handleColumnDrag(args) {
        // 实现列拖拽逻辑
        console.log('列拖拽:', args);
    }

    // 处理排序
    handleSort(args) {
        const { field, order } = args;
        this.sortData(field, order);
    }

    // 处理键盘事件
    handleKeydown(e) {
        if (!this.currentCell) return;

        switch (e.key) {
            case 'Delete':
                this.deleteCellValue();
                break;
            case 'c':
                if (e.ctrlKey || e.metaKey) {
                    this.copyCell(this.currentCell);
                }
                break;
            case 'v':
                if (e.ctrlKey || e.metaKey) {
                    this.pasteCell(this.currentCell);
                }
                break;
            case 'Enter':
                this.editCell(this.currentCell);
                break;
        }
    }

    // 编辑单元格
    editCell(args) {
        const { col, row } = args;
        const column = this.columns[col];
        
        if (column && column.type === 'image') {
            this.uploadImage(args);
        } else {
            this.table.startEditCell(col, row);
        }
    }

    // 复制单元格
    copyCell(args) {
        const { col, row } = args;
        const column = this.columns[col];
        const record = this.data[row];
        
        if (column && record) {
            const value = record[column.field];
            this.clipboard = { value, type: column.type };
            Utils.copyToClipboard(String(value || ''));
            Utils.showNotification('已复制到剪贴板', 'success', 2000);
        }
    }

    // 粘贴单元格
    pasteCell(args) {
        if (!this.clipboard) return;
        
        const { col, row } = args;
        const column = this.columns[col];
        const record = this.data[row];
        
        if (column && record) {
            record[column.field] = this.clipboard.value;
            this.table.changeCellValue(col, row, this.clipboard.value);
            this.saveData();
            Utils.showNotification('已粘贴数据', 'success', 2000);
        }
    }

    // 删除单元格值
    deleteCellValue() {
        if (!this.currentCell) return;
        
        const { col, row } = this.currentCell;
        const column = this.columns[col];
        const record = this.data[row];
        
        if (column && record) {
            record[column.field] = '';
            this.table.changeCellValue(col, row, '');
            this.saveData();
        }
    }

    // 插入行
    insertRow(args) {
        const { row } = args;
        const newRecord = this.createEmptyRecord();
        
        this.data.splice(row + 1, 0, newRecord);
        this.table.addRecord(newRecord, row + 1);
        this.updateRecordCount();
        this.saveData();
        
        Utils.showNotification('已插入新行', 'success', 2000);
    }

    // 删除行
    deleteRow(args) {
        const { row } = args;
        
        if (this.data.length <= 1) {
            Utils.showNotification('至少需要保留一行数据', 'warning', 3000);
            return;
        }
        
        this.data.splice(row, 1);
        this.table.deleteRecord(row);
        this.updateRecordCount();
        this.saveData();
        
        Utils.showNotification('已删除行', 'success', 2000);
    }

    // 上传图片
    uploadImage(args) {
        this.currentCell = args;
        Utils.showModal('imageUploadModal');
    }

    // 显示图片预览
    showImagePreview(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="display: block; max-width: 80%; max-height: 80%;">
                <div class="modal-header">
                    <h3>图片预览</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <img src="${imageUrl}" alt="预览图片" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 添加行
    addRow() {
        const newRecord = this.createEmptyRecord();
        this.data.push(newRecord);
        this.table.addRecord(newRecord);
        this.updateRecordCount();
        this.saveData();
        
        Utils.showNotification('已添加新行', 'success', 2000);
    }

    // 添加列
    addColumn(columnConfig) {
        const newColumn = {
            field: columnConfig.field || Utils.generateId(),
            title: columnConfig.title,
            width: columnConfig.width || 120,
            type: columnConfig.type || 'text',
            sort: true,
            editor: this.getEditorType(columnConfig.type),
            options: columnConfig.options
        };

        this.columns.push(newColumn);
        
        // 为现有数据添加新字段
        this.data.forEach(record => {
            record[newColumn.field] = this.getDefaultValue(newColumn.type);
        });

        // 重新初始化表格
        this.refreshTable();
        Utils.showNotification('已添加新列', 'success', 2000);
    }

    // 删除选中行
    deleteSelectedRows() {
        if (this.selectedRows.size === 0) {
            Utils.showNotification('请先选择要删除的行', 'warning', 3000);
            return;
        }

        if (this.data.length - this.selectedRows.size < 1) {
            Utils.showNotification('至少需要保留一行数据', 'warning', 3000);
            return;
        }

        const rowsToDelete = Array.from(this.selectedRows).sort((a, b) => b - a);
        
        rowsToDelete.forEach(row => {
            this.data.splice(row, 1);
            this.table.deleteRecord(row);
        });

        this.selectedRows.clear();
        this.updateRecordCount();
        this.updateSelectedCount();
        this.saveData();
        
        Utils.showNotification(`已删除 ${rowsToDelete.length} 行`, 'success', 2000);
    }

    // 排序数据
    sortData(field, order) {
        this.data = Utils.sortObjectArray(this.data, field, order);
        this.refreshTable();
    }

    // 筛选数据
    filterData(filters) {
        const filteredData = Utils.filterObjectArray(this.data, filters);
        this.table.setRecords(filteredData);
        this.updateRecordCount(filteredData.length);
    }

    // 分组数据
    groupData(field) {
        const groups = Utils.groupObjectArray(this.data, field);
        // 实现分组显示逻辑
        console.log('分组数据:', groups);
    }

    // 创建空记录
    createEmptyRecord() {
        const record = {};
        this.columns.forEach(col => {
            record[col.field] = this.getDefaultValue(col.type);
        });
        
        // 设置ID
        if (record.id !== undefined) {
            record.id = Math.max(...this.data.map(r => r.id || 0)) + 1;
        }
        
        return record;
    }

    // 获取默认值
    getDefaultValue(type) {
        switch (type) {
            case 'number':
                return 0;
            case 'date':
                return Utils.formatDate(new Date());
            case 'image':
                return '';
            default:
                return '';
        }
    }

    // 获取编辑器类型
    getEditorType(type) {
        switch (type) {
            case 'number':
                return 'input';
            case 'date':
                return 'date';
            case 'image':
                return 'image';
            case 'select':
                return 'select';
            default:
                return 'input';
        }
    }

    // 刷新表格
    refreshTable() {
        if (this.table && typeof this.table.setOption === 'function') {
            this.table.setOption({
                columns: this.buildVTableColumns(),
                records: this.data
            });
        }
    }

    // 更新记录数量
    updateRecordCount(count = null) {
        const recordCount = document.getElementById('recordCount');
        if (recordCount) {
            recordCount.textContent = count !== null ? count : this.data.length;
        }
    }

    // 更新选中数量
    updateSelectedCount() {
        const selectedCount = document.getElementById('selectedCount');
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        
        if (this.selectedRows.size > 0) {
            selectedCount.textContent = `已选择: ${this.selectedRows.size} 条`;
            selectedCount.style.display = 'inline';
            deleteBtn.style.display = 'inline-flex';
        } else {
            selectedCount.style.display = 'none';
            deleteBtn.style.display = 'none';
        }
    }

    // 保存数据
    saveData() {
        Utils.setStorage('tableData', {
            data: this.data,
            columns: this.columns
        });
    }

    // 加载数据
    loadData() {
        const saved = Utils.getStorage('tableData');
        if (saved) {
            this.data = saved.data || this.data;
            this.columns = saved.columns || this.columns;
            this.refreshTable();
        }
    }

    // 导出数据
    exportData(format = 'json') {
        switch (format) {
            case 'json':
                Utils.downloadFile(
                    JSON.stringify(this.data, null, 2),
                    'table_data.json',
                    'application/json'
                );
                break;
            case 'csv':
                const csv = this.convertToCSV(this.data);
                Utils.downloadFile(csv, 'table_data.csv', 'text/csv');
                break;
        }
        
        Utils.showNotification('数据导出成功', 'success', 2000);
    }

    // 转换为CSV
    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = this.columns.map(col => col.title).join(',');
        const rows = data.map(row => 
            this.columns.map(col => {
                const value = row[col.field] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        );
        
        return [headers, ...rows].join('\n');
    }

    // 获取表格数据
    getData() {
        return this.data;
    }

    // 获取表格列配置
    getColumns() {
        return this.columns;
    }

    // 导入CSV数据
    importCsvData(newColumns, newData, replaceExisting = false) {
        try {
            if (replaceExisting) {
                // 替换现有数据和列
                this.columns = newColumns;
                this.data = newData;
            } else {
                // 合并数据 - 需要处理列结构差异
                const mergedData = this.mergeCsvData(newColumns, newData);
                this.data = this.data.concat(mergedData);
            }

            // 刷新表格显示
            this.refreshTable();
            this.updateRecordCount();
            this.saveData();
            
            console.log('CSV数据导入成功:', {
                columns: this.columns.length,
                rows: this.data.length
            });
            
        } catch (error) {
            console.error('CSV数据导入失败:', error);
            throw error;
        }
    }

    // 合并CSV数据（处理列结构差异）
    mergeCsvData(newColumns, newData) {
        // 如果当前表格为空，直接使用新的列结构
        if (this.data.length === 0) {
            this.columns = newColumns;
            return newData;
        }

        // 创建列映射
        const columnMapping = new Map();
        const existingFields = this.columns.map(col => col.field);
        
        // 为新列创建唯一字段名
        newColumns.forEach((newCol, index) => {
            let fieldName = newCol.field;
            let counter = 1;
            
            // 确保字段名唯一
            while (existingFields.includes(fieldName)) {
                fieldName = `${newCol.field}_${counter}`;
                counter++;
            }
            
            columnMapping.set(newCol.field, fieldName);
            
            // 添加新列到现有列配置
            this.columns.push({
                ...newCol,
                field: fieldName
            });
            
            existingFields.push(fieldName);
        });

        // 转换新数据的字段名
        const mergedData = newData.map(row => {
            const newRow = {};
            Object.keys(row).forEach(oldField => {
                const newField = columnMapping.get(oldField) || oldField;
                newRow[newField] = row[oldField];
            });
            return newRow;
        });

        // 为现有数据添加新列的默认值
        this.data.forEach(existingRow => {
            columnMapping.forEach((newField, oldField) => {
                if (!(newField in existingRow)) {
                    existingRow[newField] = '';
                }
            });
        });

        return mergedData;
    }

    // 生成测试数据（扩展以支持CSV导入后的测试）
    generateTestData(count = 100) {
        const departments = ['技术部', '产品部', '设计部', '运营部', '市场部', '人事部', '财务部'];
        const statuses = ['在职', '离职', '休假'];
        const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
        
        const testData = [];
        const startId = Math.max(...this.data.map(r => r.id || 0), 0) + 1;
        
        for (let i = 0; i < count; i++) {
            const record = {};
            
            // 为每个列生成测试数据
            this.columns.forEach(col => {
                switch (col.type) {
                    case 'number':
                        if (col.field === 'id') {
                            record[col.field] = startId + i;
                        } else if (col.field === 'age') {
                            record[col.field] = Math.floor(Math.random() * 40) + 20;
                        } else {
                            record[col.field] = Math.floor(Math.random() * 1000);
                        }
                        break;
                    case 'date':
                        const randomDate = new Date();
                        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 365));
                        record[col.field] = Utils.formatDate(randomDate);
                        break;
                    case 'select':
                        if (col.options && col.options.length > 0) {
                            record[col.field] = col.options[Math.floor(Math.random() * col.options.length)];
                        } else if (col.field.includes('department')) {
                            record[col.field] = departments[Math.floor(Math.random() * departments.length)];
                        } else if (col.field.includes('status')) {
                            record[col.field] = statuses[Math.floor(Math.random() * statuses.length)];
                        } else {
                            record[col.field] = '选项' + (Math.floor(Math.random() * 5) + 1);
                        }
                        break;
                    case 'image':
                        record[col.field] = ''; // 图片字段保持为空
                        break;
                    default:
                        if (col.field.includes('name')) {
                            record[col.field] = names[Math.floor(Math.random() * names.length)] + (i + 1);
                        } else if (col.field.includes('email')) {
                            record[col.field] = `user${startId + i}@example.com`;
                        } else {
                            record[col.field] = `测试数据${i + 1}`;
                        }
                }
            });
            
            testData.push(record);
        }
        
        this.data = this.data.concat(testData);
        this.refreshTable();
        this.updateRecordCount();
        this.saveData();
        
        Utils.showNotification(`已生成${count}条测试数据`, 'success', 2000);
    }

    // 清空所有数据（包括列结构）
    clearAllData() {
        // 重置到默认状态
        this.initializeDefaultData();
        this.refreshTable();
        this.updateRecordCount();
        this.saveData();
        
        console.log('已清空所有数据并重置到默认状态');
    }

    // 清空行数据（保留列结构）
    clearRowData() {
        // 清空数据数组
        this.data = [];
        
        // 清空选中状态
        this.selectedRows.clear();
        
        // 刷新表格显示
        this.refreshTable();
        this.updateRecordCount();
        this.saveData();
        
        console.log('已清空所有行数据，保留列结构');
    }

    // 设置图片URL
    setImageUrl(row, col, url) {
        const column = this.columns[col];
        if (column && this.data[row]) {
            this.data[row][column.field] = url;
            this.table.changeCellValue(col, row, url);
            this.saveData();
        }
    }
}

// 导出表格管理器
window.TableManager = TableManager;