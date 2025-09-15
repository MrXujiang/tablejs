// 简化版表格管理器（不依赖VTable）
class SimpleTableManager {
    constructor(container) {
        this.container = container;
        this.data = [];
        this.columns = [];
        this.selectedRows = new Set();
        
        this.initializeDefaultData();
        
        // 确保 this.data 始终是数组
        if (!Array.isArray(this.data)) {
            console.warn('数据不是数组格式，重置为空数组');
            this.data = [];
        }
        
        this.initializeTable();
        this.bindEvents();
        
        // 初始化多选管理器
        setTimeout(() => {
            if (window.MultiSelectManager) {
                this.multiSelectManager = new MultiSelectManager(this);
            }
        }, 100);
        
        // 初始化多选管理器
        setTimeout(() => {
            if (window.MultiSelectManager) {
                this.multiSelectManager = new MultiSelectManager(this);
            }
        }, 100);
        
        // 初始化多选管理器
        this.multiSelectManager = new MultiSelectManager(this);
    }

    // 初始化默认数据
    initializeDefaultData() {
        // 确保数据是数组
        this.data = [];
        this.selectedRows = new Set();
        
        this.columns = [
            { field: 'id', title: 'ID', width: 80, type: 'number', editable: false },
            { field: 'name', title: '姓名', width: 120, type: 'text', editable: true },
            { field: 'age', title: '年龄', width: 80, type: 'number', editable: true },
            { field: 'email', title: '邮箱', width: 200, type: 'text', editable: true },
            { field: 'department', title: '部门', width: 120, type: 'select', editable: true, options: ['技术部', '产品部', '设计部', '运营部', '市场部'] },
            { field: 'joinDate', title: '入职日期', width: 120, type: 'date', editable: true },
            { field: 'status', title: '状态', width: 100, type: 'select', editable: true, options: ['在职', '离职', '休假'] },
            { field: 'avatar', title: '头像', width: 100, type: 'image', editable: true }
        ];

        // 生成50条默认数据
        this.data = [];
        this.generateDefaultData(50);
    }

    // 生成默认数据
    generateDefaultData(count) {
        const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六', '蒋十七', '沈十八', '韩十九', '杨二十', '朱二一', '秦二二', '尤二三', '许二四', '何二五', '吕二六', '施二七', '张二八', '孔二九', '曹三十'];
        const departments = ['技术部', '产品部', '设计部', '运营部', '市场部', '人事部', '财务部', '法务部'];
        const statuses = ['在职', '离职', '休假'];
        const domains = ['example.com', 'test.com', 'demo.com', 'company.com'];
        
        this.data = [];
        for (let i = 1; i <= count; i++) {
            const name = names[Math.floor(Math.random() * names.length)] + (i > names.length ? i : '');
            const department = departments[Math.floor(Math.random() * departments.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const domain = domains[Math.floor(Math.random() * domains.length)];
            
            // 生成随机日期（过去2年内）
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 730));
            
            this.data.push({
                id: i,
                name: name,
                age: 20 + Math.floor(Math.random() * 40),
                email: `user${i}@${domain}`,
                department: department,
                joinDate: randomDate.toISOString().split('T')[0],
                status: status,
                avatar: ''
            });
        }
    }

    // 初始化表格
    initializeTable() {
        this.renderTable();
        this.updateRecordCount();
        
        // 隐藏所有可能的加载状态
        this.hideAllLoadingStates();
    }
    
    // 隐藏所有加载状态
    hideAllLoadingStates() {
        // 隐藏加载容器
        const loadingContainers = document.querySelectorAll('.loading-container');
        loadingContainers.forEach(container => {
            container.remove();
        });
        
        // 隐藏加载遮罩
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // 通过Utils隐藏
        if (this.container && this.container.parentElement) {
            Utils.hideLoading(this.container.parentElement);
        }
        
        // 确保表格容器可见
        if (this.container) {
            this.container.style.display = 'block';
            this.container.style.visibility = 'visible';
        }
    }

    // 渲染表格
    renderTable() {
        // 添加复选框列到表头
        const checkboxHeader = `<th style="width: 50px; text-align: center; position: relative;">
            <input type="checkbox" class="select-all-checkbox" style="margin: 0;">
        </th>`;
        
        const thead = checkboxHeader + this.columns.map((col, index) => 
            `<th class="resizable-header" data-field="${col.field}" style="width: ${col.width}px; cursor: pointer; min-width: 100px;" onclick="window.app.tableManager.sortByColumn('${col.field}')">
                ${col.title}
                <i class="fas fa-sort" style="margin-left: 4px; opacity: 0.5;"></i>
                <div class="column-resizer" data-column="${index}"></div>
            </th>`
        ).join('');
        
        const tbody = Array.isArray(this.data) ? this.data.map((record, rowIndex) => {
            // 添加复选框列
            const checkboxCell = `<td style="text-align: center;">
                <input type="checkbox" class="row-checkbox" data-row="${rowIndex}" style="margin: 0;">
            </td>`;
            
            const cells = this.columns.map(col => {
                let value = record[col.field] || '';
                let cellContent = this.formatCellValue(value, col.type);
                
                const editable = col.editable ? 'editable-cell' : '';
                const dataAttrs = `data-field="${col.field}" data-row="${rowIndex}" data-type="${col.type}"`;
                
                return `<td class="${editable}" ${dataAttrs}>${cellContent}</td>`;
            }).join('');
            
            const isSelected = this.selectedRows.has(rowIndex) ? 'selected' : '';
            return `<tr data-row="${rowIndex}" class="${isSelected}">${checkboxCell}${cells}</tr>`;
        }).join('') : '';

        this.container.innerHTML = `
            <div class="simple-table-container">
                <table class="simple-table">
                    <thead><tr>${thead}</tr></thead>
                    <tbody>${tbody}</tbody>
                </table>
            </div>
        `;
    }

    // 格式化单元格值
    formatCellValue(value, type) {
        if (!value) return '';
        
        switch (type) {
            case 'date':
                return Utils.formatDate(value);
            case 'image':
                if (value && typeof value === 'string' && value.startsWith('data:image/')) {
                    return `<img src="${value}" class="cell-image" alt="图片">`;
                }
                return '<div class="image-placeholder">点击上传</div>';
            case 'select':
                return this.formatSelectValue(value);
            default:
                return value;
        }
    }

    // 格式化下拉选择值为彩色标签
    formatSelectValue(value) {
        if (!value) return '';
        
        // 预定义的颜色方案
        const colorSchemes = [
            { bg: '#e3f2fd', text: '#1976d2', border: '#bbdefb' }, // 蓝色
            { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' }, // 紫色
            { bg: '#e8f5e8', text: '#388e3c', border: '#a5d6a7' }, // 绿色
            { bg: '#fff3e0', text: '#f57c00', border: '#ffcc02' }, // 橙色
            { bg: '#fce4ec', text: '#c2185b', border: '#f8bbd9' }, // 粉色
            { bg: '#e0f2f1', text: '#00695c', border: '#80cbc4' }, // 青色
            { bg: '#f1f8e9', text: '#558b2f', border: '#aed581' }, // 浅绿色
            { bg: '#fff8e1', text: '#ff8f00', border: '#ffcc02' }, // 黄色
            { bg: '#fafafa', text: '#424242', border: '#e0e0e0' }, // 灰色
            { bg: '#ffebee', text: '#d32f2f', border: '#ffcdd2' }  // 红色
        ];

        // 根据值的哈希选择颜色
        const hash = this.hashCode(value.toString());
        const colorIndex = Math.abs(hash) % colorSchemes.length;
        const colors = colorSchemes[colorIndex];

        return `<span class="select-tag" style="
            background-color: ${colors.bg};
            color: ${colors.text};
            border: 1px solid ${colors.border};
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
            white-space: nowrap;
        ">${value}</span>`;
    }

    // 简单的哈希函数
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash;
    }

    // 绑定事件
    bindEvents() {
        // 双击编辑单元格
        this.container.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('editable-cell')) {
                this.startCellEdit(e.target);
            }
        });

        // 单元格编辑事件
        this.container.addEventListener('blur', (e) => {
            if (e.target.classList.contains('cell-editor')) {
                this.finishCellEdit(e.target);
            }
        }, true);

        // 右键菜单
        this.container.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'TD') {
                e.preventDefault();
                this.showContextMenu(e);
            }
        });

        // 键盘事件
        this.container.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('cell-editor')) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.finishCellEdit(e.target);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelCellEdit(e.target);
                }
            }
        });

        // 处理下拉选择变化
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('cell-editor')) {
                this.finishCellEdit(e.target);
            }
        });

        // 复选框事件
        this.bindCheckboxEvents();
        
        // 列宽调整事件
        this.bindColumnResizeEvents();
        
        // 多选事件
        this.bindMultiSelectEvents();
    }

    // 重新绑定编辑事件（用于CSV导入后）
    bindEditEvents() {
        // 不替换容器，只重新绑定事件
        // 移除现有的事件监听器（通过移除和重新添加表格）
        const tableContainer = this.container.querySelector('.simple-table-container');
        if (tableContainer) {
            const table = tableContainer.querySelector('table');
            if (table) {
                // 克隆表格以移除事件监听器
                const newTable = table.cloneNode(true);
                table.parentNode.replaceChild(newTable, table);
            }
        }
        
        // 重新绑定所有事件（不改变this.container引用）
        this.bindEvents();
        
        console.log('已重新绑定编辑事件，容器引用保持不变');
    }

    // 绑定复选框事件
    bindCheckboxEvents() {
        // 全选复选框事件
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('select-all-checkbox')) {
                const isChecked = e.target.checked;
                const rowCheckboxes = this.container.querySelectorAll('.row-checkbox');
                
                rowCheckboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                    const rowIndex = parseInt(checkbox.dataset.row);
                    if (isChecked) {
                        this.selectedRows.add(rowIndex);
                    } else {
                        this.selectedRows.delete(rowIndex);
                    }
                });
                
                this.updateRowSelection();
            }
            
            // 单行复选框事件
            if (e.target.classList.contains('row-checkbox')) {
                const rowIndex = parseInt(e.target.dataset.row);
                const isChecked = e.target.checked;
                
                if (isChecked) {
                    this.selectedRows.add(rowIndex);
                } else {
                    this.selectedRows.delete(rowIndex);
                }
                
                this.updateRowSelection();
                this.updateSelectAllCheckbox();
            }
        });
    }

    // 更新全选复选框状态
    updateSelectAllCheckbox() {
        const selectAllCheckbox = this.container.querySelector('.select-all-checkbox');
        const rowCheckboxes = this.container.querySelectorAll('.row-checkbox');
        const checkedCount = this.container.querySelectorAll('.row-checkbox:checked').length;
        
        if (checkedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCount === rowCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    // 更新行选中状态
    updateRowSelection() {
        const rows = this.container.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            if (this.selectedRows.has(index)) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        });
    }

    // 开始编辑单元格
    startCellEdit(cell) {
        const field = cell.dataset.field;
        const row = parseInt(cell.dataset.row);
        const type = cell.dataset.type;
        const currentValue = this.data[row] ? this.data[row][field] || '' : '';
        
        // 保存原始值
        cell.dataset.originalValue = currentValue;
        
        let editor;
        
        switch (type) {
            case 'select':
                const column = this.columns.find(col => col.field === field);
                const options = column.options || [];
                editor = document.createElement('select');
                editor.className = 'cell-editor';
                options.forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option;
                    optionEl.textContent = option;
                    optionEl.selected = option === currentValue;
                    editor.appendChild(optionEl);
                });
                break;
                
            case 'date':
                editor = document.createElement('input');
                editor.type = 'date';
                editor.className = 'cell-editor';
                editor.value = currentValue;
                break;
                
            case 'number':
                editor = document.createElement('input');
                editor.type = 'number';
                editor.className = 'cell-editor';
                editor.value = currentValue;
                break;
                
            case 'image':
                // 创建图片上传容器
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-upload-container';
                
                editor = document.createElement('input');
                editor.type = 'file';
                editor.className = 'cell-editor image-file-input';
                editor.accept = 'image/*';
                editor.style.display = 'none';
                
                const uploadBtn = document.createElement('button');
                uploadBtn.type = 'button';
                uploadBtn.className = 'image-upload-btn';
                uploadBtn.innerHTML = '<i class="fas fa-upload"></i> 选择图片';
                uploadBtn.onclick = () => editor.click();
                
                imageContainer.appendChild(uploadBtn);
                imageContainer.appendChild(editor);
                
                editor.addEventListener('change', (e) => {
                    this.handleImageUpload(e, cell);
                });
                
                // 返回容器而不是单个input
                cell.innerHTML = '';
                cell.appendChild(imageContainer);
                return; // 直接返回，不执行后面的通用逻辑
                
            default:
                editor = document.createElement('input');
                editor.type = 'text';
                editor.className = 'cell-editor';
                editor.value = currentValue;
                break;
        }
        
        // 替换单元格内容
        cell.innerHTML = '';
        cell.appendChild(editor);
        editor.focus();
        
        if (editor.select) {
            editor.select();
        }
    }

    // 完成单元格编辑
    finishCellEdit(editor) {
        const cell = editor.parentElement;
        if (!cell) return;
        
        const field = cell.dataset.field;
        const row = parseInt(cell.dataset.row);
        const newValue = editor.value;
        
        // 更新数据
        if (Array.isArray(this.data) && this.data[row]) {
            this.data[row][field] = newValue;
        }
        
        // 安全地恢复单元格显示
        try {
            const type = cell.dataset.type;
            cell.innerHTML = this.formatCellValue(newValue, type);
        } catch (error) {
            console.warn('更新单元格显示失败:', error);
            // 重新渲染整个表格作为备选方案
            this.renderTable();
        }
        
        // 保存数据
        this.saveData();
        
        Utils.showNotification('单元格已更新', 'success', 1000);
    }

    // 取消单元格编辑
    cancelCellEdit(editor) {
        const cell = editor.parentElement;
        const originalValue = cell.dataset.originalValue;
        const type = cell.dataset.type;
        
        // 恢复原始值
        cell.innerHTML = this.formatCellValue(originalValue, type);
    }

    // 处理图片上传
    async handleImageUpload(event, cell) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // 压缩图片
            const compressedFile = await Utils.compressImage(file, 400, 0.8);
            
            // 转换为Base64
            const base64 = await Utils.fileToBase64(compressedFile);
            
            // 更新数据
            const field = cell.dataset.field;
            const row = parseInt(cell.dataset.row);
            
            if (Array.isArray(this.data) && this.data[row]) {
                this.data[row][field] = base64;
            }
            
            // 更新单元格显示
            cell.innerHTML = this.formatCellValue(base64, 'image');
            
            // 保存数据
            this.saveData();
            
            Utils.showNotification('图片上传成功', 'success');
        } catch (error) {
            console.error('图片上传失败:', error);
            Utils.showNotification('图片上传失败', 'error');
        }
    }

    // 显示右键菜单
    showContextMenu(e) {
        const cell = e.target;
        const row = parseInt(cell.dataset.row);
        
        // 检查是否有多个单元格被选中
        const selectedCount = this.selectedCells ? this.selectedCells.size : 0;
        
        const menuItems = [
            {
                text: '编辑单元格',
                icon: 'fas fa-edit',
                action: () => this.startCellEdit(cell)
            },
            { divider: true },
            {
                text: '插入行',
                icon: 'fas fa-plus',
                action: () => this.insertRow(row)
            },
            {
                text: '删除行',
                icon: 'fas fa-trash',
                action: () => this.deleteRow(row)
            },
            {
                text: '复制行',
                icon: 'fas fa-copy',
                action: () => this.copyRow(row)
            }
        ];
        
        // 如果有多选单元格，添加批量操作选项
        if (selectedCount > 1) {
            menuItems.push(
                { divider: true },
                {
                    text: `清空选中的 ${selectedCount} 个单元格`,
                    icon: 'fas fa-eraser',
                    action: () => this.clearSelectedCells()
                },
                {
                    text: `复制选中的 ${selectedCount} 个单元格`,
                    icon: 'fas fa-copy',
                    action: () => this.copySelectedCells()
                }
            );
        }
        
        Utils.showContextMenu(e, menuItems);
    }

    // 添加行 - 打开弹窗录入
    addRow() {
        console.log('=== addRow 方法被调用 ===');
        // 直接调用 addRowDirectly 方法，不显示弹窗
        this.addRowDirectly();
    }

    // 直接添加行到表格底部
    addRowDirectly() {
        console.log('=== addRowDirectly 方法被调用 ===');
        console.log('当前数据长度:', this.data.length);
        
        // 创建新的空记录
        const newRecord = this.createEmptyRecord();
        
        // 为新记录设置默认值
        newRecord.name = '新员工';
        newRecord.age = 25;
        newRecord.email = '';
        newRecord.department = '技术部';
        newRecord.joinDate = new Date().toISOString().split('T')[0];
        newRecord.status = '在职';
        newRecord.avatar = '';
        
        // 添加到数据中
        this.data.push(newRecord);
        
        // 重新渲染表格
        this.renderTable();
        this.updateRecordCount();
        this.saveData();
        
        // 显示成功消息
        Utils.showNotification('已添加新行，请双击单元格进行编辑', 'success', 3000);
        
        // 滚动到新行并高亮
        setTimeout(() => {
            const newRowIndex = this.data.length - 1;
            const newRowElement = this.container.querySelector(`tr[data-row="${newRowIndex}"]`);
            if (newRowElement) {
                newRowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newRowElement.classList.add('highlight-new-row');
                
                // 3秒后移除高亮
                setTimeout(() => {
                    newRowElement.classList.remove('highlight-new-row');
                }, 3000);
                
                // 自动聚焦到姓名字段进行编辑
                const nameCell = newRowElement.querySelector('td[data-field="name"]');
                if (nameCell) {
                    setTimeout(() => {
                        nameCell.click();
                        nameCell.focus();
                    }, 500);
                }
            }
        }, 100);
    }

    // 渲染表单字段
    renderFormField(col) {
        switch (col.type) {
            case 'select':
                const options = col.options || [];
                return `
                    <select id="field_${col.field}" name="${col.field}" class="form-control">
                        <option value="">请选择${col.title}</option>
                        ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                `;
            case 'date':
                return `<input type="date" id="field_${col.field}" name="${col.field}" class="form-control">`;
            case 'number':
                return `<input type="number" id="field_${col.field}" name="${col.field}" class="form-control" min="0">`;
            case 'email':
                return `<input type="email" id="field_${col.field}" name="${col.field}" class="form-control" placeholder="请输入邮箱地址">`;
            case 'image':
                return `
                    <div class="image-upload-container">
                        <input type="file" id="field_${col.field}" name="${col.field}" class="form-control" accept="image/*">
                        <small class="form-text">支持 JPG, PNG, GIF 格式</small>
                    </div>
                `;
            default:
                return `<input type="text" id="field_${col.field}" name="${col.field}" class="form-control" placeholder="请输入${col.title}">`;
        }
    }

    // 显示添加行弹窗
    showAddRowModal() {
        console.log('showAddRowModal 被调用');
        console.log('当前列配置:', this.columns);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal add-row-modal" style="display: block;">
                <div class="modal-header">
                    <h3><i class="fas fa-plus"></i> 添加新员工</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addRowForm" class="add-row-form">
                        ${this.columns.filter(col => col.editable).map(col => `
                            <div class="form-group">
                                <label for="field_${col.field}">${col.title}${col.field === 'name' ? ' *' : ''}:</label>
                                ${this.renderFormField(col)}
                                ${col.field === 'name' ? '<small class="form-text">必填项</small>' : ''}
                            </div>
                        `).join('')}
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelAddRow">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button type="button" class="btn btn-primary" id="confirmAddRow">
                        <i class="fas fa-save"></i> 保存并添加
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('模态框已添加到DOM');
        console.log('模态框元素:', modal);

        // 绑定事件
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        modal.querySelector('.modal-close').addEventListener('click', () => {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        });
        
        modal.querySelector('#cancelAddRow').addEventListener('click', () => {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });

        modal.querySelector('#confirmAddRow').addEventListener('click', () => {
            this.handleAddRowSubmit(modal, () => {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            });
        });

        // 自动聚焦到姓名字段
        setTimeout(() => {
            const nameField = modal.querySelector('#field_name');
            if (nameField) {
                nameField.focus();
            }
        }, 100);
    }

    // 处理添加行表单提交
    handleAddRowSubmit(modal, closeCallback) {
        const form = modal.querySelector('#addRowForm');
        
        // 验证必填字段
        const nameField = form.querySelector('#field_name');
        if (!nameField || !nameField.value.trim()) {
            Utils.showNotification('请输入姓名', 'warning', 2000);
            if (nameField) nameField.focus();
            return;
        }

        const formData = new FormData(form);
        const newRecord = this.createEmptyRecord();

        // 收集表单数据
        for (const [key, value] of formData.entries()) {
            if (value) {
                // 确保 value 是字符串类型才调用 trim()
                if (typeof value === 'string') {
                    newRecord[key] = value.trim();
                } else {
                    newRecord[key] = value;
                }
            }
        }

        // 处理图片字段
        const imageFields = this.columns.filter(col => col.type === 'image');
        for (const col of imageFields) {
            const fileInput = form.querySelector(`#field_${col.field}`);
            if (fileInput && fileInput.files[0]) {
                // 这里可以集成图片处理逻辑
                newRecord[col.field] = ''; // 暂时留空，可以后续处理
            }
        }

        // 验证邮箱格式
        if (newRecord.email && !this.isValidEmail(newRecord.email)) {
            Utils.showNotification('请输入有效的邮箱地址', 'warning', 2000);
            const emailField = form.querySelector('#field_email');
            if (emailField) emailField.focus();
            return;
        }

        // 验证年龄
        if (newRecord.age && (newRecord.age < 16 || newRecord.age > 70)) {
            Utils.showNotification('年龄应在16-70岁之间', 'warning', 2000);
            const ageField = form.querySelector('#field_age');
            if (ageField) ageField.focus();
            return;
        }

        // 添加到数据中
        this.data.push(newRecord);
        this.renderTable();
        this.updateRecordCount();
        this.saveData();

        // 关闭弹窗
        if (closeCallback) closeCallback();

        // 显示成功消息
        Utils.showNotification(`员工 ${newRecord.name} 添加成功！`, 'success', 2000);

        // 滚动到新行并高亮
        setTimeout(() => {
            const newRowElement = this.container.querySelector(`tr[data-row="${this.data.length - 1}"]`);
            if (newRowElement) {
                newRowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newRowElement.classList.add('new-row');
                setTimeout(() => {
                    newRowElement.classList.remove('new-row');
                }, 2000);
            }
        }, 100);
    }

    // 验证邮箱格式
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 插入行
    insertRow(index) {
        const newRecord = this.createEmptyRecord();
        this.data.splice(index + 1, 0, newRecord);
        this.renderTable();
        this.updateRecordCount();
        this.saveData();
        
        Utils.showNotification('已插入新行', 'success', 2000);
    }

    // 删除行
    deleteRow(index) {
        if (confirm('确定要删除这一行吗？')) {
            this.data.splice(index, 1);
            this.selectedRows.delete(index);
            
            // 更新选中行索引
            const newSelectedRows = new Set();
            this.selectedRows.forEach(rowIndex => {
                if (rowIndex > index) {
                    newSelectedRows.add(rowIndex - 1);
                } else if (rowIndex < index) {
                    newSelectedRows.add(rowIndex);
                }
            });
            this.selectedRows = newSelectedRows;
            
            this.renderTable();
            this.updateRecordCount();
            this.saveData();
            
            Utils.showNotification('已删除行', 'success', 2000);
        }
    }

    // 复制行
    copyRow(index) {
        const originalRow = this.data[index];
        const newRow = { ...originalRow };
        newRow.id = Math.max(...this.data.map(item => item.id || 0)) + 1;
        
        this.data.splice(index + 1, 0, newRow);
        this.renderTable();
        this.updateRecordCount();
        this.saveData();
        
        Utils.showNotification('已复制行', 'success', 2000);
    }

    // 删除选中行
    deleteSelectedRows() {
        if (this.selectedRows.size === 0) {
            Utils.showNotification('请先选择要删除的行', 'warning');
            return;
        }

        if (confirm(`确定要删除选中的 ${this.selectedRows.size} 行吗？`)) {
            const sortedIndices = Array.from(this.selectedRows).sort((a, b) => b - a);
            
            sortedIndices.forEach(index => {
                this.data.splice(index, 1);
            });
            
            this.selectedRows.clear();
            this.renderTable();
            this.updateRecordCount();
            this.saveData();
            
            Utils.showNotification(`已删除 ${sortedIndices.length} 行`, 'success');
        }
    }

    // 创建空记录
    createEmptyRecord() {
        // 确保 this.data 是数组
        if (!Array.isArray(this.data)) {
            this.data = [];
        }
        
        const newId = this.data.length > 0 ? Math.max(...this.data.map(item => item.id || 0)) + 1 : 1;
        const record = { id: newId };
        
        this.columns.forEach(col => {
            if (col.field !== 'id') {
                record[col.field] = '';
            }
        });
        
        return record;
    }

    // 保存数据到本地存储
    saveData() {
        try {
            console.log('正在保存数据:', {
                dataLength: this.data ? this.data.length : 0,
                dataType: typeof this.data,
                isArray: Array.isArray(this.data),
                columnsLength: this.columns ? this.columns.length : 0,
                sampleData: this.data && this.data.length > 0 ? this.data[0] : null,
                sampleColumn: this.columns && this.columns.length > 0 ? this.columns[0] : null
            });
            
            // 保存数据和列配置
            const saveObject = {
                data: this.data,
                columns: this.columns,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('tableData', JSON.stringify(saveObject));
            console.log('数据和列配置保存成功');
        } catch (error) {
            console.warn('无法保存数据到本地存储:', error);
        }
    }

    // 从本地存储加载数据
    loadData() {
        try {
            const savedData = localStorage.getItem('tableData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                
                // 检查是否是新格式（包含data和columns）
                if (parsedData && typeof parsedData === 'object' && parsedData.data && parsedData.columns) {
                    // 新格式：包含数据和列配置
                    console.log('加载新格式数据:', {
                        dataLength: parsedData.data.length,
                        columnsLength: parsedData.columns.length,
                        timestamp: parsedData.timestamp
                    });
                    
                    this.data = Array.isArray(parsedData.data) ? parsedData.data : [];
                    this.columns = Array.isArray(parsedData.columns) ? parsedData.columns : this.getDefaultColumns();
                    
                } else if (Array.isArray(parsedData)) {
                    // 旧格式：只有数据数组
                    console.log('加载旧格式数据，使用默认列配置');
                    this.data = parsedData;
                    this.columns = this.getDefaultColumns();
                    
                } else {
                    console.warn('本地存储的数据格式不正确，使用默认数据');
                    this.data = [];
                    this.columns = this.getDefaultColumns();
                }
                
                console.log('数据加载完成:', {
                    dataRows: this.data.length,
                    columns: this.columns.length,
                    editableColumns: this.columns.filter(col => col.editable).length
                });
                
                this.renderTable();
                this.updateRecordCount();
            } else {
                console.log('没有找到保存的数据，使用默认配置');
                this.data = [];
                this.columns = this.getDefaultColumns();
            }
        } catch (error) {
            console.warn('无法从本地存储加载数据:', error);
            // 确保在出错时数据结构正确
            if (!Array.isArray(this.data)) {
                this.data = [];
            }
            if (!Array.isArray(this.columns)) {
                this.columns = this.getDefaultColumns();
            }
        }
    }
    
    // 获取默认列配置
    getDefaultColumns() {
        return [
            { field: 'id', title: 'ID', width: 80, type: 'number', editable: false },
            { field: 'name', title: '姓名', width: 120, type: 'text', editable: true },
            { field: 'age', title: '年龄', width: 80, type: 'number', editable: true },
            { field: 'email', title: '邮箱', width: 200, type: 'email', editable: true },
            { field: 'phone', title: '电话', width: 150, type: 'text', editable: true },
            { field: 'department', title: '部门', width: 120, type: 'text', editable: true }
        ];
    }

    // 按列排序
    sortByColumn(field) {
        const column = this.columns.find(col => col.field === field);
        if (!column || !Array.isArray(this.data)) return;

        // 切换排序方向
        column.sortDirection = column.sortDirection === 'asc' ? 'desc' : 'asc';
        
        this.data.sort((a, b) => {
            let valueA = a[field] || '';
            let valueB = b[field] || '';
            
            // 数字类型排序
            if (column.type === 'number') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            }
            // 日期类型排序
            else if (column.type === 'date') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            }
            // 字符串排序
            else {
                valueA = valueA.toString().toLowerCase();
                valueB = valueB.toString().toLowerCase();
            }
            
            if (valueA < valueB) {
                return column.sortDirection === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return column.sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        this.renderTable();
        Utils.showNotification(`已按 ${column.title} 排序`, 'info', 1000);
    }

    // 绑定列宽调整事件
    bindColumnResizeEvents() {
        let isResizing = false;
        let currentColumn = null;
        let startX = 0;
        let startWidth = 0;

        this.container.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('column-resizer')) {
                isResizing = true;
                currentColumn = e.target;
                startX = e.clientX;
                
                const th = currentColumn.closest('th');
                startWidth = parseInt(window.getComputedStyle(th).width);
                
                currentColumn.style.background = '#0056b3';
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isResizing && currentColumn) {
                requestAnimationFrame(() => {
                    const diff = e.clientX - startX;
                    const newWidth = Math.max(100, startWidth + diff);
                    
                    const th = currentColumn.closest('th');
                    const field = th.dataset.field;
                    const column = this.columns.find(col => col.field === field);
                    
                    if (column) {
                        column.width = newWidth;
                        th.style.width = newWidth + 'px';
                    }
                });
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                if (currentColumn) {
                    currentColumn.style.background = '';
                }
                currentColumn = null;
                document.body.style.cursor = '';
            }
        });

        // 鼠标悬停效果
        this.container.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('column-resizer')) {
                e.target.style.background = '#007bff';
            }
        });

        this.container.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('column-resizer') && !isResizing) {
                e.target.style.background = '';
            }
        });
    }

    // 绑定多选事件
    bindMultiSelectEvents() {
        this.selectedRows = new Set();
        
        // Ctrl+Click 多选
        this.container.addEventListener('click', (e) => {
            const row = e.target.closest('tr[data-row]');
            if (row && e.ctrlKey) {
                e.preventDefault();
                const rowIndex = parseInt(row.dataset.row);
                
                if (this.selectedRows.has(rowIndex)) {
                    this.selectedRows.delete(rowIndex);
                    row.classList.remove('selected');
                } else {
                    this.selectedRows.add(rowIndex);
                    row.classList.add('selected');
                }
                
                this.updateSelectionInfo();
            }
        });

        // Shift+Click 范围选择
        this.container.addEventListener('click', (e) => {
            const row = e.target.closest('tr[data-row]');
            if (row && e.shiftKey && this.lastSelectedRow !== null) {
                e.preventDefault();
                const currentIndex = parseInt(row.dataset.row);
                const start = Math.min(this.lastSelectedRow, currentIndex);
                const end = Math.max(this.lastSelectedRow, currentIndex);
                
                for (let i = start; i <= end; i++) {
                    this.selectedRows.add(i);
                    const targetRow = this.container.querySelector(`tr[data-row="${i}"]`);
                    if (targetRow) {
                        targetRow.classList.add('selected');
                    }
                }
                
                this.updateSelectionInfo();
            } else if (row && !e.ctrlKey && !e.shiftKey) {
                const rowIndex = parseInt(row.dataset.row);
                this.lastSelectedRow = rowIndex;
            }
        });
    }

    // 更新选择信息
    updateSelectionInfo() {
        const count = this.selectedRows.size;
        if (count > 0) {
            console.log(`已选择 ${count} 行`);
        }
    }

    // 获取选中的行数据
    getSelectedRows() {
        return Array.from(this.selectedRows).map(index => this.data[index]).filter(Boolean);
    }

    // 获取数据
    getData() {
        return this.data;
    }

    // 获取列配置
    getColumns() {
        return this.columns;
    }

    // 导出数据
    exportData(format = 'csv') {
        if (!Array.isArray(this.data) || this.data.length === 0) {
            Utils.showNotification('没有数据可导出', 'warning', 3000);
            return;
        }

        try {
            if (format === 'csv') {
                this.exportToCSV();
            } else if (format === 'json') {
                this.exportToJSON();
            } else if (format === 'excel') {
                this.exportToExcel();
            }
        } catch (error) {
            console.error('导出失败:', error);
            Utils.showNotification('导出失败: ' + error.message, 'error', 3000);
        }
    }

    // 导出为CSV
    exportToCSV() {
        const headers = this.columns.map(col => col.title).join(',');
        const rows = this.data.map(row => 
            this.columns.map(col => {
                let value = row[col.field] || '';
                // 处理包含逗号或引号的值
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            }).join(',')
        );
        
        const csvContent = [headers, ...rows].join('\n');
        this.downloadFile(csvContent, 'table-data.csv', 'text/csv');
    }

    // 导出为JSON
    exportToJSON() {
        const jsonContent = JSON.stringify(this.data, null, 2);
        this.downloadFile(jsonContent, 'table-data.json', 'application/json');
    }

    // 导出为Excel（简化版，实际为CSV格式）
    exportToExcel() {
        this.exportToCSV();
        Utils.showNotification('已导出为CSV格式（Excel兼容）', 'info', 3000);
    }

    // 下载文件
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Utils.showNotification(`文件 ${filename} 已下载`, 'success', 3000);
    }

    // 筛选数据
    filterData(filters) {
        const filteredData = Utils.filterObjectArray(this.originalData || this.data, filters);
        
        // 临时保存原始数据
        if (!this.originalData) {
            this.originalData = [...this.data];
        }
        
        // 更新显示数据
        this.data = filteredData;
        this.renderTable();
        this.updateRecordCount(filteredData.length);
    }

    // 清除筛选
    clearFilter() {
        if (this.originalData) {
            this.data = [...this.originalData];
            this.originalData = null;
            this.renderTable();
            this.updateRecordCount();
        }
    }

    // 添加列
    addColumn(columnConfig) {
        const newColumn = {
            field: Utils.generateId(),
            title: columnConfig.title,
            type: columnConfig.type || 'text',
            width: columnConfig.width || 120,
            editable: true,
            ...columnConfig
        };

        this.columns.push(newColumn);

        // 为现有数据添加新字段
        if (Array.isArray(this.data)) {
            this.data.forEach(record => {
                record[newColumn.field] = '';
            });
        }

        this.renderTable();
        Utils.showNotification(`已添加列: ${newColumn.title}`, 'success');
    }

    // 生成测试数据
    generateTestData(count) {
        const startTime = performance.now();
        
        // 清空现有数据
        this.data = [];
        this.selectedRows.clear();
        
        const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六', '蒋十七', '沈十八', '韩十九', '杨二十'];
        const departments = ['技术部', '产品部', '设计部', '运营部', '市场部', '人事部', '财务部', '法务部'];
        const statuses = ['在职', '离职', '休假'];
        const domains = ['example.com', 'test.com', 'demo.com', 'company.com'];
        
        for (let i = 1; i <= count; i++) {
            const name = names[Math.floor(Math.random() * names.length)] + i;
            const department = departments[Math.floor(Math.random() * departments.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const domain = domains[Math.floor(Math.random() * domains.length)];
            
            // 生成随机日期（过去2年内）
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 730));
            
            this.data.push({
                id: i,
                name: name,
                age: 20 + Math.floor(Math.random() * 40),
                email: `user${i}@${domain}`,
                department: department,
                joinDate: randomDate.toISOString().split('T')[0],
                status: status,
                avatar: ''
            });
        }
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        this.renderTable();
        this.updateRecordCount();
        
        // 显示性能信息
        Utils.showNotification(`成功生成 ${count} 条测试数据，渲染耗时: ${renderTime.toFixed(2)}ms`, 'success');
        
        console.log(`性能测试结果:
        - 数据量: ${count} 条
        - 生成时间: ${renderTime.toFixed(2)}ms
        - 平均每条: ${(renderTime / count).toFixed(4)}ms`);
    }

    // 更新记录数量显示
    updateRecordCount() {
        const countElement = document.querySelector('.record-count');
        if (countElement) {
            const total = this.data.length;
            const selected = this.selectedRows.size;
            countElement.textContent = `共 ${total} 条记录${selected > 0 ? `，已选中 ${selected} 条` : ''}`;
        }
    }

    // 清除所有选择
    clearSelection() {
        this.selectedRows.clear();
        this.container.querySelectorAll('tr.selected').forEach(row => {
            row.classList.remove('selected');
        });
        this.lastSelectedRow = null;
    }

    // 导入CSV数据
    importCsvData(newColumns, newData, replaceExisting = false) {
        try {
            if (replaceExisting) {
                // 替换现有数据和列，确保所有列都可编辑
                this.columns = newColumns.map(col => ({
                    ...col,
                    editable: true // 确保所有导入的列都可编辑
                }));
                this.data = newData;
            } else {
                // 合并数据 - 需要处理列结构差异
                const mergedData = this.mergeCsvData(newColumns, newData);
                this.data = this.data.concat(mergedData);
            }

            // 刷新表格显示
            this.renderTable();
            this.updateRecordCount();
            this.saveData();
            
            // 重新绑定编辑事件
            this.bindEditEvents();
            
            console.log('CSV数据导入成功:', {
                columns: this.columns.length,
                rows: this.data.length,
                editableColumns: this.columns.filter(col => col.editable).length
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
            // 转换新列配置为SimpleTableManager格式，确保所有列都可编辑
            this.columns = newColumns.map(col => ({
                field: col.field,
                title: col.title,
                width: col.width || 120,
                type: col.type || 'text',
                editable: true // 确保所有列都可编辑
            }));
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
                field: fieldName,
                title: newCol.title,
                width: newCol.width || 120,
                type: newCol.type || 'text',
                editable: true
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

    // 清空所有数据（包括列结构）
    clearAllData() {
        // 重置到默认状态
        this.initializeDefaultData();
        this.renderTable();
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
        
        // 重新渲染表格
        this.renderTable();
        this.updateRecordCount();
        this.saveData();
        
        console.log('已清空所有行数据，保留列结构');
    }
}

// 导出简化版表格管理器
window.SimpleTableManager = SimpleTableManager;