// 筛选管理器
class FilterManager {
    constructor(tableManager) {
        this.tableManager = tableManager;
        this.filters = [];
        this.originalData = [];
        
        this.initializeElements();
        this.bindEvents();
    }

    // 初始化DOM元素
    initializeElements() {
        this.filterPanel = document.getElementById('filterPanel');
        this.filterConditions = document.getElementById('filterConditions');
        this.addFilterBtn = document.getElementById('addFilterCondition');
        this.applyFilterBtn = document.getElementById('applyFilter');
        this.clearFilterBtn = document.getElementById('clearFilter');
    }

    // 绑定事件
    bindEvents() {
        if (this.addFilterBtn) {
            this.addFilterBtn.addEventListener('click', () => this.addFilterCondition());
        }

        if (this.applyFilterBtn) {
            this.applyFilterBtn.addEventListener('click', () => this.applyFilters());
        }

        if (this.clearFilterBtn) {
            this.clearFilterBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    // 显示筛选面板
    showFilterPanel() {
        if (this.filterPanel) {
            this.filterPanel.style.display = 'block';
            this.updateFieldOptions();
        }
    }

    // 隐藏筛选面板
    hideFilterPanel() {
        if (this.filterPanel) {
            this.filterPanel.style.display = 'none';
        }
    }

    // 更新字段选项
    updateFieldOptions() {
        const columns = this.tableManager.getColumns();
        const fieldOptions = columns.map(col => 
            `<option value="${col.field}">${col.title}</option>`
        ).join('');

        // 更新现有筛选条件的字段选项
        this.filterConditions.querySelectorAll('.filter-field').forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">请选择字段</option>' + fieldOptions;
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    // 添加筛选条件
    addFilterCondition() {
        const conditionId = Utils.generateId();
        const columns = this.tableManager.getColumns();
        
        const fieldOptions = columns.map(col => 
            `<option value="${col.field}">${col.title}</option>`
        ).join('');

        const operatorOptions = this.getOperatorOptions();

        const conditionHtml = `
            <div class="filter-condition" data-id="${conditionId}">
                <select class="form-control filter-field" data-field="field">
                    <option value="">请选择字段</option>
                    ${fieldOptions}
                </select>
                <select class="form-control filter-operator" data-field="operator">
                    ${operatorOptions}
                </select>
                <input type="text" class="form-control filter-value" data-field="value" placeholder="筛选值">
                <button type="button" class="remove-condition" title="删除条件">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        this.filterConditions.insertAdjacentHTML('beforeend', conditionHtml);

        // 绑定新添加条件的事件
        const newCondition = this.filterConditions.querySelector(`[data-id="${conditionId}"]`);
        this.bindConditionEvents(newCondition);
    }

    // 绑定筛选条件事件
    bindConditionEvents(condition) {
        const fieldSelect = condition.querySelector('.filter-field');
        const operatorSelect = condition.querySelector('.filter-operator');
        const valueInput = condition.querySelector('.filter-value');
        const removeBtn = condition.querySelector('.remove-condition');

        // 字段变化事件
        fieldSelect.addEventListener('change', (e) => {
            this.updateOperatorOptions(condition, e.target.value);
            this.updateValueInput(condition, e.target.value);
        });

        // 删除条件事件
        removeBtn.addEventListener('click', () => {
            condition.remove();
        });

        // 值输入事件（实时筛选）
        valueInput.addEventListener('input', Utils.debounce(() => {
            if (this.isAutoFilter()) {
                this.applyFilters();
            }
        }, 500));
    }

    // 获取操作符选项
    getOperatorOptions() {
        return `
            <option value="equals">等于</option>
            <option value="not_equals">不等于</option>
            <option value="contains">包含</option>
            <option value="not_contains">不包含</option>
            <option value="starts_with">开始于</option>
            <option value="ends_with">结束于</option>
            <option value="greater_than">大于</option>
            <option value="less_than">小于</option>
            <option value="greater_equal">大于等于</option>
            <option value="less_equal">小于等于</option>
            <option value="is_empty">为空</option>
            <option value="is_not_empty">不为空</option>
        `;
    }

    // 更新操作符选项
    updateOperatorOptions(condition, fieldName) {
        const columns = this.tableManager.getColumns();
        const column = columns.find(col => col.field === fieldName);
        const operatorSelect = condition.querySelector('.filter-operator');

        if (!column) {
            operatorSelect.innerHTML = this.getOperatorOptions();
            return;
        }

        let options = '';
        switch (column.type) {
            case 'number':
                options = `
                    <option value="equals">等于</option>
                    <option value="not_equals">不等于</option>
                    <option value="greater_than">大于</option>
                    <option value="less_than">小于</option>
                    <option value="greater_equal">大于等于</option>
                    <option value="less_equal">小于等于</option>
                    <option value="is_empty">为空</option>
                    <option value="is_not_empty">不为空</option>
                `;
                break;
            case 'date':
                options = `
                    <option value="equals">等于</option>
                    <option value="not_equals">不等于</option>
                    <option value="greater_than">晚于</option>
                    <option value="less_than">早于</option>
                    <option value="greater_equal">不早于</option>
                    <option value="less_equal">不晚于</option>
                    <option value="is_empty">为空</option>
                    <option value="is_not_empty">不为空</option>
                `;
                break;
            case 'select':
                options = `
                    <option value="equals">等于</option>
                    <option value="not_equals">不等于</option>
                    <option value="is_empty">为空</option>
                    <option value="is_not_empty">不为空</option>
                `;
                break;
            case 'image':
                options = `
                    <option value="is_empty">无图片</option>
                    <option value="is_not_empty">有图片</option>
                `;
                break;
            default:
                options = this.getOperatorOptions();
        }

        operatorSelect.innerHTML = options;
    }

    // 更新值输入框
    updateValueInput(condition, fieldName) {
        const columns = this.tableManager.getColumns();
        const column = columns.find(col => col.field === fieldName);
        const valueInput = condition.querySelector('.filter-value');

        if (!column) return;

        switch (column.type) {
            case 'number':
                valueInput.type = 'number';
                valueInput.placeholder = '请输入数字';
                break;
            case 'date':
                valueInput.type = 'date';
                valueInput.placeholder = '请选择日期';
                break;
            case 'select':
                // 转换为下拉选择
                if (column.options && column.options.length > 0) {
                    const selectHtml = `
                        <select class="form-control filter-value" data-field="value">
                            <option value="">请选择</option>
                            ${column.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    `;
                    valueInput.outerHTML = selectHtml;
                }
                break;
            default:
                valueInput.type = 'text';
                valueInput.placeholder = '请输入筛选值';
        }
    }

    // 应用筛选
    applyFilters() {
        this.filters = this.collectFilters();
        
        if (this.filters.length === 0) {
            this.clearFilters();
            return;
        }

        // 保存原始数据
        if (this.originalData.length === 0) {
            this.originalData = [...this.tableManager.getData()];
        }

        // 应用筛选
        const filteredData = Utils.filterObjectArray(this.originalData, this.filters);
        this.tableManager.filterData(this.filters);

        Utils.showNotification(`筛选完成，共 ${filteredData.length} 条记录`, 'info', 2000);
    }

    // 收集筛选条件
    collectFilters() {
        const conditions = this.filterConditions.querySelectorAll('.filter-condition');
        const filters = [];

        conditions.forEach(condition => {
            const field = condition.querySelector('.filter-field').value;
            const operator = condition.querySelector('.filter-operator').value;
            const valueElement = condition.querySelector('.filter-value');
            const value = valueElement.value;

            if (field && operator && (value !== '' || ['is_empty', 'is_not_empty'].includes(operator))) {
                filters.push({ field, operator, value });
            }
        });

        return filters;
    }

    // 清除筛选
    clearFilters() {
        this.filters = [];
        
        if (this.originalData.length > 0) {
            this.tableManager.clearFilter();
            this.originalData = [];
        }

        // 清空筛选条件
        this.filterConditions.innerHTML = '';

        Utils.showNotification('已清除所有筛选条件', 'info', 2000);
    }

    // 是否启用自动筛选
    isAutoFilter() {
        return false; // 可以添加设置来控制
    }

    // 获取当前筛选条件
    getCurrentFilters() {
        return this.filters;
    }

    // 设置筛选条件
    setFilters(filters) {
        this.clearFilters();
        
        filters.forEach(filter => {
            this.addFilterCondition();
            const conditions = this.filterConditions.querySelectorAll('.filter-condition');
            const lastCondition = conditions[conditions.length - 1];
            
            lastCondition.querySelector('.filter-field').value = filter.field;
            this.updateOperatorOptions(lastCondition, filter.field);
            lastCondition.querySelector('.filter-operator').value = filter.operator;
            this.updateValueInput(lastCondition, filter.field);
            
            setTimeout(() => {
                const valueElement = lastCondition.querySelector('.filter-value');
                if (valueElement) {
                    valueElement.value = filter.value;
                }
            }, 100);
        });

        setTimeout(() => {
            this.applyFilters();
        }, 200);
    }

    // 导出筛选条件
    exportFilters() {
        const filters = this.getCurrentFilters();
        if (filters.length === 0) {
            Utils.showNotification('没有筛选条件可导出', 'warning', 2000);
            return;
        }

        Utils.downloadFile(
            JSON.stringify(filters, null, 2),
            'filter_conditions.json',
            'application/json'
        );
        
        Utils.showNotification('筛选条件导出成功', 'success', 2000);
    }

    // 导入筛选条件
    importFilters(filtersData) {
        try {
            const filters = typeof filtersData === 'string' ? JSON.parse(filtersData) : filtersData;
            if (Array.isArray(filters)) {
                this.setFilters(filters);
                Utils.showNotification('筛选条件导入成功', 'success', 2000);
            } else {
                throw new Error('无效的筛选条件格式');
            }
        } catch (error) {
            Utils.showNotification('筛选条件导入失败: ' + error.message, 'error', 3000);
        }
    }

    // 获取筛选统计
    getFilterStats() {
        const totalRecords = this.originalData.length || this.tableManager.getData().length;
        const filteredRecords = this.tableManager.getData().length;
        
        return {
            total: totalRecords,
            filtered: filteredRecords,
            hidden: totalRecords - filteredRecords,
            hasFilters: this.filters.length > 0
        };
    }

    // 重置筛选管理器
    reset() {
        this.clearFilters();
        this.originalData = [];
    }
}

// 导出筛选管理器
window.FilterManager = FilterManager;