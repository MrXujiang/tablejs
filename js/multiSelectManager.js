// 多选管理器
class MultiSelectManager {
    constructor(tableManager) {
        this.tableManager = tableManager;
        this.container = tableManager.container;
        this.selectedCells = new Set();
        this.isSelecting = false;
        this.startCell = null;
        this.selectionBox = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.createSelectionBox();
    }
    
    // 创建选择框
    createSelectionBox() {
        if (!this.selectionBox) {
            this.selectionBox = document.createElement('div');
            this.selectionBox.className = 'selection-box';
            this.container.appendChild(this.selectionBox);
        }
    }
    
    // 显示多选信息
    showMultiSelectInfo(count) {
        let infoBox = this.container.querySelector('.multi-select-info');
        if (!infoBox) {
            infoBox = document.createElement('div');
            infoBox.className = 'multi-select-info';
            this.container.appendChild(infoBox);
        }
        infoBox.textContent = `已选择 ${count} 个单元格`;
        infoBox.style.display = count > 0 ? 'block' : 'none';
    }
    
    // 绑定事件
    bindEvents() {
        // 鼠标按下开始选择
        this.container.addEventListener('mousedown', (e) => {
            const cell = e.target.closest('td');
            if (!cell || !cell.dataset.field) return;
            
            // 按住Ctrl或Cmd键进行多选
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                
                if (this.selectedCells.has(cell)) {
                    this.selectedCells.delete(cell);
                    cell.classList.remove('selected-cell');
                } else {
                    this.selectedCells.add(cell);
                    cell.classList.add('selected-cell');
                }
                
                this.showMultiSelectInfo(this.selectedCells.size);
                return;
            }
            
            // 清除之前的选择
            this.clearSelection();
            
            // 开始框选
            if (e.shiftKey) {
                e.preventDefault();
                this.startSelection(cell);
            }
        });
        
        // 鼠标移动更新选择框
        this.container.addEventListener('mousemove', (e) => {
            if (!this.isSelecting || !this.startCell) return;
            
            const currentCell = e.target.closest('td');
            if (!currentCell || !currentCell.dataset.field) return;
            
            this.updateSelection(currentCell);
        });
        
        // 鼠标抬起完成选择
        document.addEventListener('mouseup', (e) => {
            if (!this.isSelecting) return;
            this.finishSelection();
        });
        
        // ESC键清除选择
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearAllSelections();
            }
        });
    }
    
    // 开始选择
    startSelection(cell) {
        this.isSelecting = true;
        this.startCell = cell;
        this.container.classList.add('selecting');
        
        const rect = cell.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        this.selectionBox.style.left = (rect.left - containerRect.left) + 'px';
        this.selectionBox.style.top = (rect.top - containerRect.top) + 'px';
        this.selectionBox.style.width = rect.width + 'px';
        this.selectionBox.style.height = rect.height + 'px';
        this.selectionBox.style.display = 'block';
    }
    
    // 更新选择
    updateSelection(currentCell) {
        const containerRect = this.container.getBoundingClientRect();
        const startRect = this.startCell.getBoundingClientRect();
        const currentRect = currentCell.getBoundingClientRect();
        
        const left = Math.min(startRect.left, currentRect.left) - containerRect.left;
        const top = Math.min(startRect.top, currentRect.top) - containerRect.top;
        const right = Math.max(startRect.right, currentRect.right) - containerRect.left;
        const bottom = Math.max(startRect.bottom, currentRect.bottom) - containerRect.top;
        
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = (right - left) + 'px';
        this.selectionBox.style.height = (bottom - top) + 'px';
        
        // 高亮选择范围内的单元格
        const cells = this.container.querySelectorAll('td[data-field]');
        cells.forEach(cell => {
            cell.classList.remove('selecting');
            const cellRect = cell.getBoundingClientRect();
            
            if (cellRect.left >= Math.min(startRect.left, currentRect.left) &&
                cellRect.right <= Math.max(startRect.right, currentRect.right) &&
                cellRect.top >= Math.min(startRect.top, currentRect.top) &&
                cellRect.bottom <= Math.max(startRect.bottom, currentRect.bottom)) {
                cell.classList.add('selecting');
            }
        });
    }
    
    // 完成选择
    finishSelection() {
        this.isSelecting = false;
        this.container.classList.remove('selecting');
        
        if (this.selectionBox) {
            this.selectionBox.style.display = 'none';
        }
        
        // 将临时选择转为正式选择
        const selectingCells = this.container.querySelectorAll('td.selecting');
        selectingCells.forEach(cell => {
            cell.classList.remove('selecting');
            cell.classList.add('selected-cell');
            this.selectedCells.add(cell);
        });
        
        this.showMultiSelectInfo(this.selectedCells.size);
        this.startCell = null;
    }
    
    // 清除选择
    clearSelection() {
        this.selectedCells.forEach(cell => cell.classList.remove('selected-cell'));
        this.selectedCells.clear();
    }
    
    // 清除所有选择
    clearAllSelections() {
        this.clearSelection();
        this.showMultiSelectInfo(0);
        
        if (this.selectionBox) {
            this.selectionBox.style.display = 'none';
        }
        
        this.isSelecting = false;
        this.container.classList.remove('selecting');
        
        // 清除临时选择样式
        const selectingCells = this.container.querySelectorAll('td.selecting');
        selectingCells.forEach(cell => cell.classList.remove('selecting'));
    }
    
    // 清空选中的单元格
    clearSelectedCells() {
        if (this.selectedCells.size === 0) return;
        
        Utils.showConfirm(
            `确定要清空选中的 ${this.selectedCells.size} 个单元格吗？`,
            () => {
                this.selectedCells.forEach(cell => {
                    const field = cell.dataset.field;
                    const row = parseInt(cell.dataset.row);
                    
                    if (Array.isArray(this.tableManager.data) && this.tableManager.data[row]) {
                        this.tableManager.data[row][field] = '';
                        cell.innerHTML = '';
                    }
                });
                
                this.tableManager.saveData();
                Utils.showNotification(`已清空 ${this.selectedCells.size} 个单元格`, 'success');
                
                this.clearAllSelections();
            }
        );
    }
    
    // 复制选中的单元格
    copySelectedCells() {
        if (this.selectedCells.size === 0) return;
        
        const cellData = [];
        this.selectedCells.forEach(cell => {
            const field = cell.dataset.field;
            const row = parseInt(cell.dataset.row);
            const value = this.tableManager.data[row] ? this.tableManager.data[row][field] || '' : '';
            
            cellData.push({
                field: field,
                row: row,
                value: value,
                text: cell.textContent || ''
            });
        });
        
        // 将数据转换为文本格式
        const textData = cellData.map(item => `${item.field}: ${item.text}`).join('\n');
        
        Utils.copyToClipboard(textData);
        Utils.showNotification(`已复制 ${this.selectedCells.size} 个单元格的数据`, 'success');
    }
    
    // 获取选中的单元格数量
    getSelectedCount() {
        return this.selectedCells.size;
    }
    
    // 获取选中的单元格
    getSelectedCells() {
        return Array.from(this.selectedCells);
    }
}

// 导出类
window.MultiSelectManager = MultiSelectManager;