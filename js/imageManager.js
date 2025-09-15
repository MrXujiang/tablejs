// 图片管理器
class ImageManager {
    constructor(tableManager) {
        this.tableManager = tableManager;
        this.currentCell = null;
        this.uploadedImages = new Map();
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImage = document.getElementById('previewImage');
        this.confirmUploadBtn = document.getElementById('confirmUpload');
    }

    bindEvents() {
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', () => {
                this.imageInput?.click();
            });

            this.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.uploadArea.classList.add('dragover');
            });

            this.uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
            });

            this.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
                
                const files = Array.from(e.dataTransfer.files);
                const imageFile = files.find(file => Utils.isImageFile(file.name));
                
                if (imageFile) {
                    this.handleImageFile(imageFile);
                } else {
                    Utils.showNotification('请选择图片文件', 'warning', 2000);
                }
            });
        }

        if (this.imageInput) {
            this.imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && Utils.isImageFile(file.name)) {
                    this.handleImageFile(file);
                } else {
                    Utils.showNotification('请选择有效的图片文件', 'warning', 2000);
                }
            });
        }

        if (this.confirmUploadBtn) {
            this.confirmUploadBtn.addEventListener('click', () => {
                this.confirmImageUpload();
            });
        }
    }

    setCurrentCell(cellInfo) {
        this.currentCell = cellInfo;
    }

    async handleImageFile(file) {
        try {
            console.log('处理图片文件:', file.name, file.size);
            
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                Utils.showNotification('图片文件大小不能超过5MB', 'error', 3000);
                return;
            }

            this.showUploadLoading(true);
            const compressedFile = await this.compressImage(file);
            const base64 = await Utils.fileToBase64(compressedFile);
            
            this.showImagePreview(base64);
            
            this.currentImageData = {
                file: compressedFile,
                base64: base64,
                name: file.name,
                size: compressedFile.size,
                type: compressedFile.type
            };

            console.log('图片处理完成:', this.currentImageData.name);
            this.showUploadLoading(false);
            
        } catch (error) {
            console.error('处理图片失败:', error);
            Utils.showNotification('图片处理失败: ' + error.message, 'error', 3000);
            this.showUploadLoading(false);
        }
    }

    compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = this.calculateNewSize(
                    img.width, 
                    img.height, 
                    maxWidth, 
                    maxHeight
                );

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('图片压缩失败'));
                    }
                }, file.type, quality);
            };

            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };

            img.src = URL.createObjectURL(file);
        });
    }

    calculateNewSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;

        if (width <= maxWidth && height <= maxHeight) {
            return { width, height };
        }

        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio);

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        return { width, height };
    }

    showImagePreview(imageSrc) {
        if (this.previewImage && this.imagePreview) {
            this.previewImage.src = imageSrc;
            this.imagePreview.style.display = 'block';
            this.uploadArea.style.display = 'none';
        }
    }

    hideImagePreview() {
        if (this.imagePreview && this.uploadArea) {
            this.imagePreview.style.display = 'none';
            this.uploadArea.style.display = 'block';
            this.previewImage.src = '';
        }
    }

    showUploadLoading(show) {
        if (this.uploadArea) {
            if (show) {
                this.uploadArea.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>处理图片中...</p>
                `;
            } else {
                this.uploadArea.innerHTML = `
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>点击或拖拽图片到此处上传</p>
                `;
            }
        }
    }

    confirmImageUpload() {
        console.log('确认上传图片:', {
            hasImageData: !!this.currentImageData,
            hasCurrentCell: !!this.currentCell,
            currentCell: this.currentCell,
            currentCellTagName: this.currentCell?.tagName,
            currentCellDataset: this.currentCell?.dataset
        });
        
        if (!this.currentImageData) {
            Utils.showNotification('请先选择图片', 'warning', 2000);
            return;
        }
        
        // 检查单元格是否有效
        if (!this.currentCell || !this.currentCell.dataset || !this.currentCell.dataset.field) {
            console.error('无效的单元格:', this.currentCell);
            Utils.showNotification('请先右键选择一个有效的单元格', 'warning', 2000);
            return;
        }

        try {
            const imageId = Utils.generateId();
            this.uploadedImages.set(imageId, this.currentImageData);
            
            // 直接操作单元格DOM
            if (this.currentCell) {
                const img = document.createElement('img');
                img.src = this.currentImageData.base64;
                img.alt = this.currentImageData.name;
                img.className = 'cell-image';
                img.title = `${this.currentImageData.name}`;
                
                // 清空单元格并插入图片
                this.currentCell.innerHTML = '';
                this.currentCell.appendChild(img);
                
                // 更新表格数据
                const field = this.currentCell.dataset.field;
                const row = parseInt(this.currentCell.dataset.row);
                
                if (this.tableManager.data && this.tableManager.data[row] && field) {
                    this.tableManager.data[row][field] = this.currentImageData.base64;
                    this.tableManager.saveData();
                }
                
                // 移除可编辑属性
                this.currentCell.classList.remove('editable-cell');
                this.currentCell.removeAttribute('contenteditable');
            }
            
            Utils.hideModal();
            
            // 重置状态但保留单元格引用直到下次使用
            this.currentImageData = null;
            this.hideImagePreview();
            if (this.imageInput) {
                this.imageInput.value = '';
            }
            
            Utils.showNotification('图片上传成功', 'success', 2000);
            
        } catch (error) {
            console.error('上传图片失败:', error);
            Utils.showNotification('图片上传失败: ' + error.message, 'error', 3000);
        }
    }

    resetUploadState() {
        this.currentImageData = null;
        // 不要重置 currentCell，因为它是从右键菜单设置的
        this.hideImagePreview();
        
        if (this.imageInput) {
            this.imageInput.value = '';
        }
    }

    deleteImage(imageId) {
        if (this.uploadedImages.has(imageId)) {
            this.uploadedImages.delete(imageId);
            Utils.showNotification('图片已删除', 'info', 2000);
        }
    }

    getImageInfo(imageId) {
        return this.uploadedImages.get(imageId);
    }

    getAllImages() {
        return Array.from(this.uploadedImages.entries()).map(([id, data]) => ({
            id,
            name: data.name,
            size: data.size,
            type: data.type,
            uploadTime: data.uploadTime || new Date().toISOString()
        }));
    }

    cleanupUnusedImages() {
        const tableData = this.tableManager.getData();
        const columns = this.tableManager.getColumns();
        const imageColumns = columns.filter(col => col.type === 'image');
        
        const usedImageIds = new Set();
        tableData.forEach(record => {
            imageColumns.forEach(col => {
                const value = record[col.field];
                if (value && typeof value === 'string' && value.startsWith('data:image/')) {
                    // 直接存储base64，暂时跳过ID检查
                }
            });
        });

        let deletedCount = 0;
        for (const [imageId] of this.uploadedImages) {
            if (!usedImageIds.has(imageId)) {
                this.uploadedImages.delete(imageId);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            Utils.showNotification(`已清理 ${deletedCount} 个未使用的图片`, 'info', 2000);
        } else {
            Utils.showNotification('没有需要清理的图片', 'info', 2000);
        }
    }

    exportImages() {
        const images = this.getAllImages();
        if (images.length === 0) {
            Utils.showNotification('没有图片可导出', 'warning', 2000);
            return;
        }

        Utils.downloadFile(
            JSON.stringify(images, null, 2),
            'images_data.json',
            'application/json'
        );
        
        Utils.showNotification('图片数据导出成功', 'success', 2000);
    }
}

window.ImageManager = ImageManager;