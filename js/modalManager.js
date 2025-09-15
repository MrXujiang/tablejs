// 弹窗管理器
class ModalManager {
    constructor() {
        this.init();
    }

    init() {
        // 绑定全局事件
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // 点击遮罩关闭弹窗
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });
    }

    // 显示添加行弹窗
    showAddRowDialog() {
        console.log('显示添加行弹窗');
        
        const columns = [
            { field: 'name', title: '姓名', type: 'text', required: true },
            { field: 'age', title: '年龄', type: 'number' },
            { field: 'email', title: '邮箱', type: 'email' },
            { field: 'department', title: '部门', type: 'select', options: ['技术部', '产品部', '设计部', '运营部', '市场部'] },
            { field: 'joinDate', title: '入职日期', type: 'date' },
            { field: 'status', title: '状态', type: 'select', options: ['在职', '离职', '休假'] }
        ];

        const formHTML = columns.map(col => {
            let inputHTML = '';
            switch (col.type) {
                case 'select':
                    inputHTML = `
                        <select id="add_${col.field}" class="form-control" ${col.required ? 'required' : ''}>
                            <option value="">请选择${col.title}</option>
                            ${col.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    `;
                    break;
                case 'date':
                    inputHTML = `<input type="date" id="add_${col.field}" class="form-control" ${col.required ? 'required' : ''}>`;
                    break;
                case 'number':
                    inputHTML = `<input type="number" id="add_${col.field}" class="form-control" min="16" max="70" ${col.required ? 'required' : ''}>`;
                    break;
                case 'email':
                    inputHTML = `<input type="email" id="add_${col.field}" class="form-control" placeholder="请输入邮箱" ${col.required ? 'required' : ''}>`;
                    break;
                default:
                    inputHTML = `<input type="text" id="add_${col.field}" class="form-control" placeholder="请输入${col.title}" ${col.required ? 'required' : ''}>`;
            }
            
            return `
                <div class="form-group">
                    <label for="add_${col.field}">${col.title}${col.required ? ' *' : ''}:</label>
                    ${inputHTML}
                </div>
            `;
        }).join('');

        const modalHTML = `
            <div class="modal-overlay" id="addRowModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div class="modal-container" style="background: white; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;"><i class="fas fa-plus"></i> 添加新员工</h3>
                        <button class="modal-close" onclick="document.getElementById('addRowModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <form id="addRowForm" class="add-row-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            ${formHTML}
                        </form>
                    </div>
                    <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('addRowModal').remove()" style="padding: 8px 16px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-times"></i> 取消
                        </button>
                        <button type="button" class="btn btn-primary" onclick="window.modalManager.handleAddRowSubmit()" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-save"></i> 保存并添加
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 聚焦到姓名字段
        setTimeout(() => {
            const nameInput = document.getElementById('add_name');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    // 处理添加行表单提交
    handleAddRowSubmit() {
        console.log('处理添加行表单提交');
        
        const form = document.getElementById('addRowForm');
        if (!form) return;

        // 收集表单数据
        const newRow = {};
        
        // 获取所有输入字段的值
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            const field = input.id.replace('add_', '');
            newRow[field] = input.value;
        });

        // 验证必填字段
        if (!newRow.name || newRow.name.trim() === '') {
            alert('请输入姓名');
            document.getElementById('add_name').focus();
            return;
        }

        // 验证邮箱格式
        if (newRow.email && newRow.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newRow.email)) {
                alert('请输入有效的邮箱地址');
                document.getElementById('add_email').focus();
                return;
            }
        }

        // 生成ID
        const app = window.app;
        const currentData = app?.tableManager?.getData() || [];
        newRow.id = currentData.length > 0 ? Math.max(...currentData.map(row => row.id || 0)) + 1 : 1;

        // 添加到表格
        if (app?.tableManager && app.tableManager.data) {
            app.tableManager.data.push(newRow);
            app.tableManager.render();
        }

        // 关闭弹窗
        document.getElementById('addRowModal').remove();
        
        // 显示成功消息
        if (window.Utils) {
            Utils.showNotification('员工添加成功', 'success', 2000);
        }
        
        console.log('新员工已添加:', newRow);
    }

    // 显示导出选项弹窗
    showExportDialog() {
        console.log('显示导出选项弹窗');
        
        const modalHTML = `
            <div class="modal-overlay" id="exportModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div class="modal-container" style="background: white; border-radius: 8px; max-width: 500px; width: 90%;">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;"><i class="fas fa-download"></i> 导出数据</h3>
                        <button class="modal-close" onclick="document.getElementById('exportModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div class="export-options" style="display: flex; flex-direction: column; gap: 15px;">
                            <div class="export-option" onclick="window.modalManager.handleExport('csv')" style="display: flex; align-items: center; padding: 15px; border: 2px solid #e9ecef; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#007bff'; this.style.backgroundColor='#f8f9ff'" onmouseout="this.style.borderColor='#e9ecef'; this.style.backgroundColor='transparent'">
                                <i class="fas fa-file-csv" style="font-size: 24px; color: #28a745; margin-right: 15px;"></i>
                                <div class="option-content">
                                    <h4 style="margin: 0 0 5px 0; font-size: 16px;">CSV 格式</h4>
                                    <p style="margin: 0; color: #6c757d; font-size: 14px;">适用于 Excel 和其他表格软件</p>
                                </div>
                            </div>
                            <div class="export-option" onclick="window.modalManager.handleExport('json')" style="display: flex; align-items: center; padding: 15px; border: 2px solid #e9ecef; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#007bff'; this.style.backgroundColor='#f8f9ff'" onmouseout="this.style.borderColor='#e9ecef'; this.style.backgroundColor='transparent'">
                                <i class="fas fa-file-code" style="font-size: 24px; color: #ffc107; margin-right: 15px;"></i>
                                <div class="option-content">
                                    <h4 style="margin: 0 0 5px 0; font-size: 16px;">JSON 格式</h4>
                                    <p style="margin: 0; color: #6c757d; font-size: 14px;">适用于程序开发和数据交换</p>
                                </div>
                            </div>
                            <div class="export-option" onclick="window.modalManager.handleExport('excel')" style="display: flex; align-items: center; padding: 15px; border: 2px solid #e9ecef; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#007bff'; this.style.backgroundColor='#f8f9ff'" onmouseout="this.style.borderColor='#e9ecef'; this.style.backgroundColor='transparent'">
                                <i class="fas fa-file-excel" style="font-size: 24px; color: #17a2b8; margin-right: 15px;"></i>
                                <div class="option-content">
                                    <h4 style="margin: 0 0 5px 0; font-size: 16px;">Excel 格式</h4>
                                    <p style="margin: 0; color: #6c757d; font-size: 14px;">Microsoft Excel 兼容格式</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('exportModal').remove()" style="padding: 8px 16px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-times"></i> 取消
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 处理导出
    handleExport(format) {
        console.log('导出格式:', format);
        
        const app = window.app;
        if (app?.tableManager && typeof app.tableManager.exportData === 'function') {
            app.tableManager.exportData(format);
        } else {
            if (window.Utils) {
                Utils.showNotification('导出功能暂不可用', 'error', 3000);
            }
        }
        
        // 关闭弹窗
        document.getElementById('exportModal').remove();
    }

    // 关闭所有弹窗
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }
}

// 创建全局弹窗管理器实例
// window.modalManager = new ModalManager(); // 暂时禁用，使用SimpleTableManager的方法
console.log('modalManager已禁用，使用SimpleTableManager的添加行功能');