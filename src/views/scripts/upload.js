// views/scripts/upload.js

// Helper function to format bytes for display
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper to show modern application toasts
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('appToast');
    const toastText = document.getElementById('toastText');
    const toastIcon = toastEl.querySelector('.toast-body i');
    
    if (toastText) {
        toastText.textContent = message;
    }
    
    // Set icons
    if (toastIcon) {
        toastIcon.className = '';
        if (type === 'success') {
            toastIcon.className = 'bi bi-check-circle-fill me-2 text-success-bright';
        } else if (type === 'error') {
            toastIcon.className = 'bi bi-exclamation-octagon-fill me-2 text-danger';
        } else {
            toastIcon.className = 'bi bi-info-circle-fill me-2 text-primary';
        }
    }
    
    const bootstrapToast = new bootstrap.Toast(toastEl);
    bootstrapToast.show();
}

// Function to copy text to clipboard
function copyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Link copied to clipboard!');
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('Failed to copy link.', 'error');
    }
    document.body.removeChild(textArea);
}

// Main logic
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileSelectionArea = document.getElementById('fileSelectionArea');
    const uploadTriggerButton = document.getElementById('uploadTriggerButton');
    
    const queueContainer = document.getElementById('queueContainer');
    const queueList = document.getElementById('queueList');
    
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const progressMessage = document.getElementById('progressMessage');
    const progressPercentage = document.getElementById('progressPercentage');
    const uploadStatus = document.getElementById('uploadStatus');
    
    const successPanel = document.getElementById('successPanel');
    const successFilesList = document.getElementById('successFilesList');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');

    // Modals
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const deleteFileNameDisplay = document.getElementById('deleteFileNameDisplay');

    const qrModal = document.getElementById('qrModal');
    const modalQrCodeImg = document.getElementById('modalQrCodeImg');
    const closeQrModalBtn = document.getElementById('closeQrModalBtn');

    // Active upload tracking
    let queuedFiles = [];
    let activeDeleteFileName = null;

    // --- UPLOAD DROPZONE LOGIC ---
    
    // File change handler
    fileInput.addEventListener('change', () => {
        handleFileSelection(fileInput.files);
    });

    // Drag & Drop event bindings
    fileSelectionArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileSelectionArea.classList.add('dragging');
    });

    fileSelectionArea.addEventListener('dragleave', () => {
        fileSelectionArea.classList.remove('dragging');
    });

    fileSelectionArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileSelectionArea.classList.remove('dragging');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files);
        }
    });

    function handleFileSelection(files) {
        // Add new files to our internal queue
        for (let i = 0; i < files.length; i++) {
            queuedFiles.push(files[i]);
        }
        renderQueue();
    }

    function renderQueue() {
        queueList.innerHTML = '';
        if (queuedFiles.length === 0) {
            queueContainer.classList.add('hidden');
            uploadTriggerButton.classList.add('d-none');
            return;
        }

        queueContainer.classList.remove('hidden');
        uploadTriggerButton.classList.remove('d-none');

        queuedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'queue-item animate-float';
            
            // File type icon
            let fileIconClass = 'bi-file-earmark';
            const ext = file.name.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) fileIconClass = 'bi-file-earmark-image';
            else if (['mp4', 'webm', 'ogg'].includes(ext)) fileIconClass = 'bi-file-earmark-play';
            else if (['mp3', 'wav', 'flac'].includes(ext)) fileIconClass = 'bi-file-earmark-music';
            else if (['zip', 'rar', 'tar', 'gz'].includes(ext)) fileIconClass = 'bi-file-earmark-zip';
            else if (['pdf'].includes(ext)) fileIconClass = 'bi-file-earmark-pdf';
            
            item.innerHTML = `
                <div class="queue-file-info">
                    <i class="bi ${fileIconClass} text-indigo" style="font-size: 1.15rem;"></i>
                    <span class="queue-file-name" title="${file.name}">${file.name}</span>
                    <span class="queue-file-size">(${formatBytes(file.size)})</span>
                </div>
                <button type="button" class="btn-remove-queue" data-index="${index}">
                    <i class="bi bi-x-circle-fill"></i>
                </button>
            `;
            queueList.appendChild(item);
        });

        // Add remove handlers
        const removeButtons = queueList.querySelectorAll('.btn-remove-queue');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-index'));
                queuedFiles.splice(idx, 1);
                renderQueue();
            });
        });
    }

    // --- FORM UPLOAD SUBMIT LOGIC ---
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (queuedFiles.length === 0) {
            showToast('Please queue at least one file.', 'error');
            return;
        }

        // Hide form inputs and queue, show progress bar
        fileSelectionArea.style.pointerEvents = 'none';
        uploadTriggerButton.classList.add('d-none');
        queueContainer.classList.add('hidden');
        progressBarContainer.classList.remove('hidden');

        // Reset progress bar state
        progressBar.style.width = '0%';
        progressPercentage.textContent = '0%';
        progressMessage.textContent = `Uploading ${queuedFiles.length} file(s)...`;
        uploadStatus.textContent = '';

        const formData = new FormData();
        queuedFiles.forEach(file => {
            formData.append('file', file);
        });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                progressBar.style.width = percent + '%';
                progressPercentage.textContent = `${Math.round(percent)}%`;
                uploadStatus.textContent = `Uploaded ${formatBytes(event.loaded)} of ${formatBytes(event.total)}`;
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const result = JSON.parse(xhr.responseText);
                    if (result.success && result.files) {
                        progressBarContainer.classList.add('hidden');
                        renderSuccessPanel(result.files);
                    } else {
                        handleUploadError('Invalid response payload.');
                    }
                } catch (err) {
                    console.error('Failed to parse response:', err);
                    handleUploadError('Upload succeeded but metadata parsing failed.');
                }
            } else {
                handleUploadError(`Upload failed with status code ${xhr.status}`);
            }
        };

        xhr.onerror = () => {
            handleUploadError('Network connection failed during upload.');
        };

        xhr.send(formData);
    });

    function handleUploadError(errMsg) {
        showToast(errMsg, 'error');
        progressBar.style.width = '100%';
        progressBar.style.backgroundColor = '#f87171'; // Error color
        progressMessage.textContent = 'Upload Failed!';
        progressPercentage.textContent = '';
        
        setTimeout(() => {
            // Restore upload form state
            progressBarContainer.classList.add('hidden');
            fileSelectionArea.style.pointerEvents = 'auto';
            uploadTriggerButton.classList.remove('d-none');
            progressBar.style.backgroundColor = ''; // Reset
            renderQueue();
        }, 3000);
    }

    function renderSuccessPanel(filesList) {
        successFilesList.innerHTML = '';
        successPanel.classList.remove('hidden');
        fileSelectionArea.classList.add('hidden');

        filesList.forEach(file => {
            const card = document.createElement('div');
            card.className = 'success-file-card';
            card.innerHTML = `
                <div class="s-file-header">
                    <span class="s-file-title" title="${file.originalName}"><i class="bi bi-file-earmark-check text-success-bright me-2"></i>${file.originalName}</span>
                    <span class="s-file-size badge bg-success-glow">${file.fileSize}</span>
                </div>
                <div class="s-file-actions-row">
                    <a href="${file.viewLink}" class="btn-outline-glow btn-small-glow" target="_blank">
                        <i class="bi bi-eye"></i> Preview
                    </a>
                    <button class="btn-outline-glow btn-small-glow btn-copy-link" data-link="${file.downloadLink}">
                        <i class="bi bi-share"></i> Share Link
                    </button>
                    <button class="btn-outline-glow btn-small-glow btn-copy-link" data-link="${file.cdnLink}">
                        <i class="bi bi-code-slash"></i> CDN Link
                    </button>
                    <button class="btn-outline-glow btn-small-glow btn-qr-link" data-qr="${file.qrCodeImage}">
                        <i class="bi bi-qr-code"></i> QR Code
                    </button>
                </div>
            `;
            successFilesList.appendChild(card);
        });

        // Attach event listeners inside success cards
        successFilesList.querySelectorAll('.btn-copy-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const link = btn.getAttribute('data-link');
                copyToClipboard(link);
                
                const oldHtml = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-clipboard-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = oldHtml;
                }, 2000);
            });
        });

        successFilesList.querySelectorAll('.btn-qr-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const qrBase64 = btn.getAttribute('data-qr');
                modalQrCodeImg.src = qrBase64;
                qrModal.classList.remove('hidden');
            });
        });
    }

    // Done button on success panel reloads page to fetch new file list
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // --- SEARCH BAR INVENTORY FILTER ---
    const searchFilesInput = document.getElementById('searchFilesInput');
    const inventoryBody = document.getElementById('inventoryBody');
    const emptyRow = document.getElementById('emptyStateRow');

    if (searchFilesInput && inventoryBody) {
        searchFilesInput.addEventListener('input', () => {
            const filter = searchFilesInput.value.toLowerCase().trim();
            const rows = inventoryBody.querySelectorAll('tr:not(#emptyStateRow)');
            let visibleRowsCount = 0;

            rows.forEach(row => {
                const origName = row.getAttribute('data-originalname').toLowerCase();
                const fileName = row.getAttribute('data-filename').toLowerCase();
                if (origName.includes(filter) || fileName.includes(filter)) {
                    row.style.display = '';
                    visibleRowsCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            // If empty row is present
            if (rows.length === 0) return;

            // Handle virtual empty state
            let virtualEmptyRow = document.getElementById('virtualEmptyRow');
            if (visibleRowsCount === 0) {
                if (!virtualEmptyRow) {
                    virtualEmptyRow = document.createElement('tr');
                    virtualEmptyRow.id = 'virtualEmptyRow';
                    virtualEmptyRow.innerHTML = `
                        <td colspan="5" class="text-center py-4 text-muted">
                            <i class="bi bi-search-emoji me-2" style="font-size: 1.5rem;"></i> No matching files found.
                        </td>
                    `;
                    inventoryBody.appendChild(virtualEmptyRow);
                }
            } else {
                if (virtualEmptyRow) {
                    virtualEmptyRow.remove();
                }
            }
        });
    }

    // --- INVENTORY TABLE EVENT HANDLERS ---
    
    // Copy Share Link
    document.querySelectorAll('.btn-copy-share').forEach(btn => {
        btn.addEventListener('click', () => {
            const link = btn.getAttribute('data-link');
            copyToClipboard(link);
        });
    });

    // Copy CDN Link
    document.querySelectorAll('.btn-copy-cdn').forEach(btn => {
        btn.addEventListener('click', () => {
            const link = btn.getAttribute('data-link');
            copyToClipboard(link);
        });
    });

    // Show QR Code modal
    document.querySelectorAll('.btn-show-qr').forEach(btn => {
        btn.addEventListener('click', () => {
            const link = btn.getAttribute('data-link');
            // Dynamically generate QR base64 using library or load it from backend
            // In the controller, cdn link is passed to scanned QR.
            // We can generate it dynamically inside browser or call an API, but wait!
            // Let's generate QR code base64 from a online service, or generate dynamic canvas!
            // Generating base64 using a free, fast URL is super easy:
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}`;
            modalQrCodeImg.src = qrApiUrl;
            qrModal.classList.remove('hidden');
        });
    });

    // Trigger Deletion confirmation modal
    document.querySelectorAll('.btn-delete-file').forEach(btn => {
        btn.addEventListener('click', () => {
            const fileName = btn.getAttribute('data-filename');
            const row = btn.closest('tr');
            const originalName = row.getAttribute('data-originalname');

            activeDeleteFileName = fileName;
            deleteFileNameDisplay.textContent = originalName;
            deleteModal.classList.remove('hidden');
        });
    });

    // Modal Cancellations
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.add('hidden');
            activeDeleteFileName = null;
        });
    }

    if (closeQrModalBtn) {
        closeQrModalBtn.addEventListener('click', () => {
            qrModal.classList.add('hidden');
            modalQrCodeImg.src = '';
        });
    }

    // Modal backdrop click cancellations
    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.classList.add('hidden');
            activeDeleteFileName = null;
        }
        if (e.target === qrModal) {
            qrModal.classList.add('hidden');
            modalQrCodeImg.src = '';
        }
    });

    // Confirm Deletion fetch handler
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!activeDeleteFileName) return;

            try {
                const response = await fetch(`/delete/${activeDeleteFileName}`, {
                    method: 'POST'
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    deleteModal.classList.add('hidden');
                    showToast('File deleted successfully!');
                    
                    // Remove row from UI dynamically
                    const row = document.querySelector(`tr[data-filename="${activeDeleteFileName}"]`);
                    if (row) {
                        row.classList.add('animate-shake'); // Fun deletion anim effect
                        setTimeout(() => {
                            row.remove();
                            // Check if empty state needs to be displayed
                            const remainingRows = inventoryBody.querySelectorAll('tr:not(#emptyStateRow):not(#virtualEmptyRow)');
                            if (remainingRows.length === 0) {
                                if (emptyRow) {
                                    emptyRow.style.display = '';
                                } else {
                                    window.location.reload();
                                }
                            }
                        }, 300);
                    }
                } else {
                    showToast(data.error || 'Failed to delete file.', 'error');
                }
            } catch (err) {
                console.error('Delete error:', err);
                showToast('Connection error occurred while deleting.', 'error');
            } finally {
                activeDeleteFileName = null;
            }
        });
    }
});
