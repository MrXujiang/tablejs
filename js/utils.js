// 工具类
class Utils {
    // 显示加载状态
    static showLoading(container) {
        const loadingHtml = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>正在加载表格...</p>
                </div>
            </div>
        `;
        container.innerHTML = loadingHtml;
    }

    // 隐藏加载状态
    static hideLoading(container) {
        const loadingContainer = container.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
    }

    // 格式化日期
    static formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('zh-CN');
    }

    // 生成唯一ID
    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    // 显示通知
    static showNotification(message, type = 'info', duration = 3000) {
        // 移除现有通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => notification.classList.add('show'), 10);

        // 自动隐藏
        const hideNotification = () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };

        // 点击关闭
        notification.querySelector('.notification-close').addEventListener('click', hideNotification);

        // 自动关闭
        if (duration > 0) {
            setTimeout(hideNotification, duration);
        }
    }

    // 获取通知图标
    static getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // 显示确认对话框
    static showConfirm(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content confirm-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-question-circle"></i> 确认操作</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelBtn">取消</button>
                    <button class="btn btn-primary" id="confirmBtn">确认</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('#confirmBtn').addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm();
        });

        modal.querySelector('#cancelBtn').addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
                if (onCancel) onCancel();
            }
        });

        setTimeout(() => modal.classList.add('show'), 10);
    }

    // 显示模态框
    static showModal(modalId) {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        overlay.style.display = 'flex';
        overlay.classList.add('active');
        
        // 隐藏所有模态框
        overlay.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        
        // 显示指定模态框
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // 隐藏模态框
    static hideModal() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        overlay.classList.remove('active');
        
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        }, 300);
    }

    // 显示右键菜单
    static showContextMenu(event, menuItems) {
        // 移除现有菜单
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        if (!Array.isArray(menuItems) || menuItems.length === 0) {
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        menuItems.forEach(item => {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.className = 'context-menu-divider';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                menuItem.innerHTML = `
                    <i class="${item.icon || 'fas fa-circle'}"></i>
                    <span>${item.text}</span>
                `;
                menuItem.addEventListener('click', () => {
                    // 支持 action 和 handler 两种属性名
                    const callback = item.action || item.handler;
                    if (callback) callback();
                    Utils.hideContextMenu();
                });
                menu.appendChild(menuItem);
            }
        });

        document.body.appendChild(menu);

        // 定位菜单
        const x = event.clientX;
        const y = event.clientY;
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('show');

        // 确保菜单在视窗内
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > viewportHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }

        // 点击外部关闭菜单
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', closeHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 10);

        // ESC键关闭菜单
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // 隐藏右键菜单
    static hideContextMenu() {
        const menu = document.querySelector('.context-menu');
        if (menu) {
            menu.classList.remove('show');
            setTimeout(() => {
                if (menu.parentNode) {
                    menu.parentNode.removeChild(menu);
                }
            }, 200);
        }
    }

    // 深拷贝对象
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 对象数组排序
    static sortObjectArray(array, key, direction = 'asc') {
        if (!Array.isArray(array)) return [];
        
        return array.sort((a, b) => {
            let valueA = a[key];
            let valueB = b[key];
            
            // 处理数字
            if (!isNaN(valueA) && !isNaN(valueB)) {
                valueA = parseFloat(valueA);
                valueB = parseFloat(valueB);
            }
            // 处理字符串
            else if (typeof valueA === 'string' && typeof valueB === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            if (valueA < valueB) {
                return direction === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // 对象数组筛选
    static filterObjectArray(array, filters) {
        if (!Array.isArray(array)) return [];
        if (!Array.isArray(filters) || filters.length === 0) return array;
        
        return array.filter(item => {
            return filters.every(filter => {
                const { field, operator, value } = filter;
                const itemValue = item[field];
                
                switch (operator) {
                    case 'equals':
                        return itemValue == value;
                    case 'not_equals':
                        return itemValue != value;
                    case 'contains':
                        return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
                    case 'not_contains':
                        return !String(itemValue).toLowerCase().includes(String(value).toLowerCase());
                    case 'starts_with':
                        return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
                    case 'ends_with':
                        return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
                    case 'greater_than':
                        return Number(itemValue) > Number(value);
                    case 'less_than':
                        return Number(itemValue) < Number(value);
                    case 'greater_equal':
                        return Number(itemValue) >= Number(value);
                    case 'less_equal':
                        return Number(itemValue) <= Number(value);
                    default:
                        return true;
                }
            });
        });
    }

    // 对象数组分组
    static groupObjectArray(array, key) {
        if (!Array.isArray(array)) return {};
        
        return array.reduce((groups, item) => {
            const group = item[key] || '未分组';
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    }

    // 导出数据为CSV
    static exportToCSV(data, filename = 'export.csv') {
        if (!Array.isArray(data) || data.length === 0) {
            this.showNotification('没有数据可导出', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 压缩图片
    static compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // 文件转Base64
    static fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 验证邮箱格式
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 验证手机号格式
    static isValidPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    // 格式化文件大小
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 获取随机颜色
    static getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 复制到剪贴板
    static copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('已复制到剪贴板', 'success', 1000);
            });
        } else {
            // 兼容旧浏览器
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('已复制到剪贴板', 'success', 1000);
        }
    }
    // 本地存储操作
    static getStorage(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.warn('读取本地存储失败:', error);
            return null;
        }
    }

    static setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('保存到本地存储失败:', error);
            return false;
        }
    }

    static removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('删除本地存储失败:', error);
            return false;
        }
    }

    // 清空所有本地存储
    static clearStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.warn('清空本地存储失败:', error);
            return false;
        }
    }

    // 隐藏右键菜单
    static hideContextMenu() {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }
}

// 导出工具类
window.Utils = Utils;