// 主应用程序
class App {
    constructor() {
        this.tableManager = null;
        this.filterManager = null;
        this.groupManager = null;
        this.imageManager = null;
        
        this.init();
    }

    // 初始化应用
    init() {
        // 显示加载状态
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }

        // 延迟初始化，确保DOM完全加载
        setTimeout(() => {
            try {
                this.initializeManagers();
                this.bindEvents();
                this.loadSavedData();
                
                // 确保隐藏加载状态
                this.hideAllLoadingStates();
                
                Utils.showNotification('多维表格编辑器已就绪', 'success', 2000);
            } catch (error) {
                console.error('应用初始化失败:', error);
                this.hideAllLoadingStates();
                Utils.showNotification('应用初始化失败: ' + error.message, 'error', 5000);
            }
        }, 100);
    }

    // 隐藏所有加载状态
    hideAllLoadingStates() {
        // 隐藏所有可能的加载容器
        const loadingContainers = document.querySelectorAll('.loading-container');
        loadingContainers.forEach(container => {
            container.remove();
        });
        
        // 隐藏加载遮罩
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
            loadingOverlay.style.display = 'none';
        }
        
        // 通过Utils隐藏
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer && tableContainer.parentElement) {
            Utils.hideLoading(tableContainer.parentElement);
        }
        
        console.log('所有加载状态已隐藏');
    }

    // 初始化管理器
    initializeManagers() {
        const tableContainer = document.getElementById('tableContainer');
        
        if (tableContainer) {
            // 直接使用简化版表格管理器
            console.log('使用简化版表格管理器');
            this.tableManager = new SimpleTableManager(tableContainer);
            console.log('SimpleTableManager 初始化完成:', this.tableManager);
            console.log('addRow 方法存在:', typeof this.tableManager.addRow === 'function');
            
            this.filterManager = new FilterManager(this.tableManager);
            this.groupManager = new GroupManager(this.tableManager);
            this.imageManager = new ImageManager(this.tableManager);
            
            console.log('所有管理器初始化完成');
        } else {
            console.error('找不到表格容器');
        }
    }

    // 绑定事件
    bindEvents() {
        this.bindToolbarEvents();
        this.bindSidebarEvents();
        this.bindModalEvents();
        this.bindKeyboardShortcuts();
    }

    // 绑定工具栏事件
    bindToolbarEvents() {
        console.log('开始绑定工具栏事件');
        
        // 添加行按钮
        const addRowBtn = document.getElementById('addRowBtn');
        console.log('添加行按钮元素:', addRowBtn);
        
        if (addRowBtn) {
            console.log('绑定添加行按钮点击事件');
            addRowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('添加行按钮被点击');
                if (this.tableManager && typeof this.tableManager.addRow === 'function') {
                    this.tableManager.addRow();
                } else {
                    console.error('tableManager.addRow 方法不存在');
                    Utils.showNotification('添加行功能暂不可用', 'error', 3000);
                }
            });
            console.log('添加行按钮事件绑定完成');
        } else {
            console.error('找不到添加行按钮');
        }

        // 添加列按钮
        const addColumnBtn = document.getElementById('addColumnBtn');
        if (addColumnBtn) {
            addColumnBtn.addEventListener('click', () => {
                Utils.showModal('addColumnModal');
            });
        }

        // CSV导入按钮
        const importCsvBtn = document.getElementById('importCsvBtn');
        if (importCsvBtn) {
            importCsvBtn.addEventListener('click', () => {
                Utils.showModal('importCsvModal');
            });
        }

        // 筛选按钮
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.toggleSidebar();
                this.filterManager?.showFilterPanel();
                this.groupManager?.hideGroupPanel();
            });
        }

        // 分组按钮
        const groupBtn = document.getElementById('groupBtn');
        if (groupBtn) {
            groupBtn.addEventListener('click', () => {
                this.toggleSidebar();
                this.groupManager?.showGroupPanel();
                this.filterManager?.hideFilterPanel();
            });
        }

        // 清空数据按钮
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.showClearDataDialog();
            });
        }

        // 保存按钮
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveData();
            });
        }

        // 导出按钮
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('导出按钮被点击');
                this.showExportDialog();
            });
        }

        // 删除选中行按钮
        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => {
                this.tableManager?.deleteSelectedRows();
            });
        }
    }

    // 绑定侧边栏事件
    bindSidebarEvents() {
        // 侧边栏切换按钮
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.hideSidebar();
            });
        }

        // 点击遮罩关闭侧边栏
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                if (!sidebar.contains(e.target) && !e.target.closest('.btn')) {
                    this.hideSidebar();
                }
            }
        });
    }

    // 绑定模态框事件
    bindModalEvents() {
        // 模态框关闭按钮
        document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = btn.getAttribute('data-modal');
                if (modalId || btn.classList.contains('modal-close')) {
                    Utils.hideModal();
                }
            });
        });

        // 点击遮罩关闭模态框
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    Utils.hideModal();
                }
            });
        }

        // 添加列表单提交
        const addColumnForm = document.getElementById('addColumnForm');
        if (addColumnForm) {
            addColumnForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddColumn();
            });
        }

        // 确认添加列按钮
        const confirmAddColumnBtn = document.getElementById('confirmAddColumn');
        if (confirmAddColumnBtn) {
            confirmAddColumnBtn.addEventListener('click', () => {
                this.handleAddColumn();
            });
        }

        // 列类型变化事件
        const columnType = document.getElementById('columnType');
        if (columnType) {
            columnType.addEventListener('change', (e) => {
                this.toggleSelectOptions(e.target.value === 'select');
            });
        }

        // CSV导入相关事件
        this.bindCsvImportEvents();
    }

    // 绑定键盘快捷键
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveData();
            }

            // Ctrl/Cmd + N: 添加新行
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.tableManager?.addRow();
            }

            // Ctrl/Cmd + F: 打开筛选
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.toggleSidebar();
                this.filterManager?.showFilterPanel();
            }

            // Ctrl/Cmd + G: 打开分组
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                this.toggleSidebar();
                this.groupManager?.showGroupPanel();
            }

            // ESC: 关闭侧边栏和模态框
            if (e.key === 'Escape') {
                this.hideSidebar();
                Utils.hideModal();
                Utils.hideContextMenu();
            }
        });
    }

    // 切换侧边栏
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    // 隐藏侧边栏
    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }

    // 切换选择选项显示
    toggleSelectOptions(show) {
        const selectOptionsGroup = document.getElementById('selectOptionsGroup');
        if (selectOptionsGroup) {
            selectOptionsGroup.style.display = show ? 'block' : 'none';
        }
    }

    // 处理添加列
    handleAddColumn() {
        const titleInput = document.getElementById('columnTitle');
        const typeSelect = document.getElementById('columnType');
        const widthInput = document.getElementById('columnWidth');
        const optionsTextarea = document.getElementById('selectOptions');

        if (!titleInput?.value.trim()) {
            Utils.showNotification('请输入列名称', 'warning', 2000);
            return;
        }

        const columnConfig = {
            title: titleInput.value.trim(),
            type: typeSelect?.value || 'text',
            width: parseInt(widthInput?.value) || 120
        };

        // 处理下拉选择选项
        if (columnConfig.type === 'select' && optionsTextarea?.value.trim()) {
            columnConfig.options = optionsTextarea.value
                .split('\n')
                .map(opt => opt.trim())
                .filter(opt => opt.length > 0);
        }

        // 添加列
        this.tableManager?.addColumn(columnConfig);

        // 重置表单
        if (titleInput) titleInput.value = '';
        if (typeSelect) typeSelect.value = 'text';
        if (widthInput) widthInput.value = '120';
        if (optionsTextarea) optionsTextarea.value = '';
        this.toggleSelectOptions(false);

        // 关闭模态框
        Utils.hideModal();
    }



    // 显示导出对话框
    showExportDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="display: block;">
                <div class="modal-header">
                    <h3>导出数据</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>选择导出格式：</label>
                        <div class="export-options">
                            <button class="btn btn-primary export-option" data-format="json">
                                <i class="fas fa-file-code"></i>
                                JSON 格式
                            </button>
                            <button class="btn btn-primary export-option" data-format="csv">
                                <i class="fas fa-file-csv"></i>
                                CSV 格式
                            </button>
                            <button class="btn btn-primary export-option" data-format="excel">
                                <i class="fas fa-file-excel"></i>
                                Excel 格式
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">取消</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定导出选项点击事件
        modal.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.getAttribute('data-format');
                this.tableManager?.exportData(format);
                document.body.removeChild(modal);
            });
        });
        
        // 绑定关闭事件
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 显示导出选项
    showExportOptions() {
        const menuItems = [
            {
                text: '导出为 JSON',
                icon: 'fas fa-file-code',
                handler: () => this.tableManager?.exportData('json')
            },
            {
                text: '导出为 CSV',
                icon: 'fas fa-file-csv',
                handler: () => this.tableManager?.exportData('csv')
            },
            { divider: true },
            {
                text: '导出筛选条件',
                icon: 'fas fa-filter',
                handler: () => this.filterManager?.exportFilters()
            },
            {
                text: '导出分组数据',
                icon: 'fas fa-layer-group',
                handler: () => this.groupManager?.exportGroupedData()
            },
            {
                text: '导出图片数据',
                icon: 'fas fa-images',
                handler: () => this.imageManager?.exportImages()
            }
        ];

        // 获取导出按钮位置
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            const rect = exportBtn.getBoundingClientRect();
            // 创建模拟事件对象
            const mockEvent = {
                clientX: rect.left,
                clientY: rect.bottom + 5,
                preventDefault: () => {}
            };
            
            // 转换菜单项格式以匹配 Utils.showContextMenu 的期望格式
            const formattedMenuItems = menuItems.map(item => ({
                text: item.label,
                icon: item.icon,
                action: item.handler
            }));
            
            Utils.showContextMenu(mockEvent, formattedMenuItems);
        }
    }

    // 保存数据
    saveData() {
        try {
            console.log('开始保存数据...');
            console.log('tableManager 存在:', !!this.tableManager);
            console.log('tableManager.saveData 方法存在:', typeof this.tableManager?.saveData === 'function');
            
            if (this.tableManager && typeof this.tableManager.saveData === 'function') {
                this.tableManager.saveData();
                console.log('tableManager.saveData() 调用完成');
            } else {
                console.error('tableManager 或其 saveData 方法不存在');
                throw new Error('表格管理器未正确初始化');
            }
            
            // 保存筛选和分组状态
            const appState = {
                filters: this.filterManager?.getCurrentFilters() || [],
                group: this.groupManager?.getCurrentGroup() || null,
                timestamp: new Date().toISOString()
            };
            
            Utils.setStorage('appState', appState);
            Utils.showNotification('数据保存成功', 'success', 2000);
            
        } catch (error) {
            console.error('保存失败:', error);
            Utils.showNotification('数据保存失败: ' + error.message, 'error', 3000);
        }
    }

    // 加载保存的数据
    loadSavedData() {
        try {
            // 加载表格数据
            this.tableManager?.loadData();
            
            // 加载应用状态
            const appState = Utils.getStorage('appState');
            if (appState) {
                // 恢复筛选条件
                if (appState.filters && appState.filters.length > 0) {
                    setTimeout(() => {
                        this.filterManager?.setFilters(appState.filters);
                    }, 1000);
                }
                
                // 恢复分组设置
                if (appState.group) {
                    setTimeout(() => {
                        this.groupManager?.setGroup(appState.group.field, appState.group.sort);
                    }, 1500);
                }
            }
            
        } catch (error) {
            console.error('加载数据失败:', error);
            Utils.showNotification('数据加载失败: ' + error.message, 'error', 3000);
        }
    }

    // 重置应用
    resetApp() {
        if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
            // 清除存储
            Utils.removeStorage('tableData');
            Utils.removeStorage('appState');
            
            // 重置管理器
            this.filterManager?.reset();
            this.groupManager?.reset();
            
            // 重新初始化表格
            this.tableManager?.initializeDefaultData();
            this.tableManager?.refreshTable();
            
            Utils.showNotification('应用已重置', 'info', 2000);
        }
    }

    // 获取应用统计信息
    getAppStats() {
        const tableData = this.tableManager?.getData() || [];
        const columns = this.tableManager?.getColumns() || [];
        const filterStats = this.filterManager?.getFilterStats() || {};
        const groupStats = this.groupManager?.getGroupStats() || {};
        const images = this.imageManager?.getAllImages() || [];

        return {
            records: tableData.length,
            columns: columns.length,
            filters: filterStats,
            groups: groupStats,
            images: images.length,
            lastSaved: Utils.getStorage('appState')?.timestamp || null
        };
    }

    // 显示应用信息
    showAppInfo() {
        const stats = this.getAppStats();
        const info = `
            <div style="text-align: left; line-height: 1.6;">
                <h4>表格统计</h4>
                <p>记录数: ${stats.records}</p>
                <p>列数: ${stats.columns}</p>
                <p>图片数: ${stats.images}</p>
                <p>筛选条件: ${stats.filters.hasFilters ? '已应用' : '无'}</p>
                <p>分组状态: ${stats.groups.hasGroup ? '已分组' : '无'}</p>
                <p>最后保存: ${stats.lastSaved ? Utils.formatDate(stats.lastSaved, 'YYYY-MM-DD HH:mm:ss') : '未保存'}</p>
            </div>
        `;
        
        // 创建信息模态框
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal" style="display: block;">
                <div class="modal-header">
                    <h3>应用信息</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${info}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-info">关闭</button>
                    <button class="btn btn-danger reset-app">重置应用</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.close-info').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.reset-app').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.resetApp();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 绑定CSV导入事件
    bindCsvImportEvents() {
        const csvUploadArea = document.getElementById('csvUploadArea');
        const csvFileInput = document.getElementById('csvFileInput');
        const confirmImportBtn = document.getElementById('confirmImportCsv');

        if (csvUploadArea && csvFileInput) {
            // 点击上传区域
            csvUploadArea.addEventListener('click', () => {
                csvFileInput.click();
            });

            // 文件选择事件
            csvFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleCsvFile(file);
                }
            });

            // 拖拽事件
            csvUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                csvUploadArea.classList.add('dragover');
            });

            csvUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                csvUploadArea.classList.remove('dragover');
            });

            csvUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                csvUploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type === 'text/csv') {
                    this.handleCsvFile(files[0]);
                } else {
                    Utils.showNotification('请选择CSV文件', 'warning', 3000);
                }
            });
        }

        // 确认导入按钮
        if (confirmImportBtn) {
            confirmImportBtn.addEventListener('click', () => {
                this.confirmCsvImport();
            });
        }
    }

    // 处理CSV文件
    handleCsvFile(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            Utils.showNotification('请选择CSV文件', 'warning', 3000);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                this.parseCsvData(csvText);
            } catch (error) {
                console.error('CSV文件读取失败:', error);
                Utils.showNotification('CSV文件读取失败', 'error', 3000);
            }
        };
        reader.readAsText(file, 'UTF-8');
    }

    // 解析CSV数据
    parseCsvData(csvText) {
        try {
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
                Utils.showNotification('CSV文件为空', 'warning', 3000);
                return;
            }

            // 解析CSV行
            const rows = lines.map(line => this.parseCsvLine(line));
            
            // 检查是否有标题行
            const hasHeaderRow = document.getElementById('hasHeaderRow').checked;
            let headers = [];
            let dataRows = [];

            if (hasHeaderRow && rows.length > 0) {
                headers = rows[0];
                dataRows = rows.slice(1);
            } else {
                // 生成默认列名
                const columnCount = rows[0]?.length || 0;
                headers = Array.from({length: columnCount}, (_, i) => `列${i + 1}`);
                dataRows = rows;
            }

            this.csvData = {
                headers,
                rows: dataRows
            };

            this.showCsvPreview();
            
        } catch (error) {
            console.error('CSV解析失败:', error);
            Utils.showNotification('CSV解析失败: ' + error.message, 'error', 3000);
        }
    }

    // 解析CSV行（处理引号和逗号）
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // 转义的引号
                    current += '"';
                    i++; // 跳过下一个引号
                } else {
                    // 切换引号状态
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 字段分隔符
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // 添加最后一个字段
        result.push(current.trim());
        
        return result;
    }

    // 显示CSV预览
    showCsvPreview() {
        const previewGroup = document.getElementById('csvPreviewGroup');
        const optionsGroup = document.getElementById('csvOptionsGroup');
        const confirmBtn = document.getElementById('confirmImportCsv');
        const previewContainer = document.getElementById('csvPreview');

        if (!this.csvData || !previewContainer) return;

        // 创建预览表格
        const maxPreviewRows = 5; // 最多预览5行
        const previewRows = this.csvData.rows.slice(0, maxPreviewRows);
        
        let tableHtml = '<table class="csv-preview-table">';
        
        // 表头
        tableHtml += '<thead><tr>';
        this.csvData.headers.forEach(header => {
            tableHtml += `<th>${header || '未命名列'}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // 数据行
        tableHtml += '<tbody>';
        previewRows.forEach(row => {
            tableHtml += '<tr>';
            this.csvData.headers.forEach((_, index) => {
                const cellValue = row[index] || '';
                tableHtml += `<td>${cellValue}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';
        tableHtml += '</table>';
        
        if (this.csvData.rows.length > maxPreviewRows) {
            tableHtml += `<p class="preview-note">显示前${maxPreviewRows}行，共${this.csvData.rows.length}行数据</p>`;
        }
        
        previewContainer.innerHTML = tableHtml;
        
        // 显示预览和选项
        previewGroup.style.display = 'block';
        optionsGroup.style.display = 'block';
        confirmBtn.style.display = 'inline-block';
    }

    // 确认导入CSV
    confirmCsvImport() {
        if (!this.csvData) {
            Utils.showNotification('没有可导入的数据', 'warning', 3000);
            return;
        }

        try {
            const replaceExisting = document.getElementById('replaceExistingData').checked;
            
            // 创建新的列配置
            const newColumns = this.csvData.headers.map((header, index) => ({
                field: `col_${index}`,
                title: header || `列${index + 1}`,
                width: 120,
                type: 'text',
                sort: true,
                editor: 'input'
            }));

            // 创建新的数据行
            const newData = this.csvData.rows.map((row, rowIndex) => {
                const record = {};
                newColumns.forEach((col, colIndex) => {
                    record[col.field] = row[colIndex] || '';
                });
                return record;
            });

            // 导入数据到表格管理器
            if (this.tableManager) {
                if (replaceExisting) {
                    // 替换现有数据
                    this.tableManager.importCsvData(newColumns, newData, true);
                } else {
                    // 追加数据
                    this.tableManager.importCsvData(newColumns, newData, false);
                }
            }

            // 关闭模态框
            Utils.hideModal();
            
            // 重置CSV导入状态
            this.resetCsvImportState();
            
            Utils.showNotification(`成功导入${newData.length}行数据`, 'success', 3000);
            
        } catch (error) {
            console.error('CSV导入失败:', error);
            Utils.showNotification('CSV导入失败: ' + error.message, 'error', 3000);
        }
    }

    // 重置CSV导入状态
    resetCsvImportState() {
        this.csvData = null;
        
        const csvFileInput = document.getElementById('csvFileInput');
        const previewGroup = document.getElementById('csvPreviewGroup');
        const optionsGroup = document.getElementById('csvOptionsGroup');
        const confirmBtn = document.getElementById('confirmImportCsv');
        const previewContainer = document.getElementById('csvPreview');
        
        if (csvFileInput) csvFileInput.value = '';
        if (previewGroup) previewGroup.style.display = 'none';
        if (optionsGroup) optionsGroup.style.display = 'none';
        if (confirmBtn) confirmBtn.style.display = 'none';
        if (previewContainer) previewContainer.innerHTML = '';
    }

    // 显示清空数据对话框
    showClearDataDialog() {
        const currentDataCount = this.tableManager?.getData()?.length || 0;
        
        if (currentDataCount === 0) {
            Utils.showNotification('当前没有数据需要清空', 'info', 2000);
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal clear-data-modal" style="display: block;">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> 确认清空数据</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 20px;">
                        <div class="warning-icon" style="font-size: 48px; color: #dc2626; margin-bottom: 16px;">
                            <i class="fas fa-trash-alt"></i>
                        </div>
                        <h4 style="color: #dc2626; margin-bottom: 16px;">⚠️ 警告：此操作不可撤销</h4>
                        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                            您即将清空表格中的所有数据（共 <strong style="color: #dc2626;">${currentDataCount}</strong> 条记录）。<br>
                            此操作将删除所有行数据，但保留列结构。<br>
                            <strong style="color: #dc2626;">此操作无法撤销，请谨慎操作！</strong>
                        </p>
                        <div class="clear-options">
                            <label class="checkbox-label" style="justify-content: center;">
                                <input type="checkbox" id="clearColumnsAlso">
                                <span>同时清空列结构（恢复到默认状态）</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">
                        <i class="fas fa-times"></i>
                        取消
                    </button>
                    <button class="btn btn-danger" id="confirmClearData">
                        <i class="fas fa-trash-alt"></i>
                        确认清空
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定确认清空事件
        modal.querySelector('#confirmClearData').addEventListener('click', () => {
            const clearColumns = modal.querySelector('#clearColumnsAlso').checked;
            this.confirmClearData(clearColumns);
            document.body.removeChild(modal);
        });
        
        // 绑定关闭事件
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // 自动聚焦到取消按钮（安全选项）
        setTimeout(() => {
            const cancelBtn = modal.querySelector('.btn-secondary');
            if (cancelBtn) {
                cancelBtn.focus();
            }
        }, 100);
    }

    // 确认清空数据
    confirmClearData(clearColumns = false) {
        try {
            if (this.tableManager) {
                if (clearColumns) {
                    // 清空所有数据并重置到默认状态
                    this.tableManager.clearAllData();
                } else {
                    // 只清空行数据，保留列结构
                    this.tableManager.clearRowData();
                }
            }

            // 清除相关状态
            this.filterManager?.reset();
            this.groupManager?.reset();
            
            Utils.showNotification(
                clearColumns ? '已清空所有数据并重置列结构' : '已清空所有行数据', 
                'success', 
                3000
            );
            
        } catch (error) {
            console.error('清空数据失败:', error);
            Utils.showNotification('清空数据失败: ' + error.message, 'error', 3000);
        }
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 加载完成，开始初始化应用...');
    
    // 检查必要的DOM元素
    const tableContainer = document.getElementById('tableContainer');
    if (!tableContainer) {
        console.error('找不到表格容器元素');
        return;
    }
    
    // 等待一段时间确保所有资源加载完成
    setTimeout(() => {
        try {
            window.app = new App();
            console.log('应用初始化完成');
            
            // 添加全局快捷键提示
            console.log(`
            🚀 多维表格编辑器快捷键:
            Ctrl/Cmd + S: 保存数据
            Ctrl/Cmd + N: 添加新行
            Ctrl/Cmd + F: 打开筛选面板
            Ctrl/Cmd + G: 打开分组面板
            ESC: 关闭面板和模态框
            `);
        } catch (error) {
            console.error('应用初始化失败:', error);
            
            // 隐藏加载状态并显示错误
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                        <span>应用初始化失败</span>
                        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">重新加载</button>
                    </div>
                `;
            }
        }
    }, 1000);
});

// 备用初始化方案
window.addEventListener('load', () => {
    console.log('页面完全加载完成');
    
    // 如果应用还没有初始化，尝试再次初始化
    if (!window.app) {
        console.log('尝试备用初始化方案...');
        setTimeout(() => {
            if (!window.app) {
                try {
                    window.app = new App();
                } catch (error) {
                    console.error('备用初始化也失败了:', error);
                }
            }
        }, 2000);
    }
});

// 导出应用类
window.App = App;