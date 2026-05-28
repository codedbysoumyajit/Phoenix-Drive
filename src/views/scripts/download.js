// views/scripts/download.js

document.addEventListener('DOMContentLoaded', () => {
    const downloadLink = document.getElementById('downloadLink');
    const errorBox = document.getElementById('errorBox');

    if (downloadLink) {
        downloadLink.addEventListener('click', async (event) => {
            event.preventDefault(); // Stop standard link navigation

            // Clear previous errors
            if (errorBox) {
                errorBox.style.display = 'none';
                errorBox.textContent = '';
            }

            const fileName = downloadLink.getAttribute('data-file-name');
            const originalName = downloadLink.getAttribute('download') || fileName;

            // Update button state to loading
            const originalHtml = downloadLink.innerHTML;
            downloadLink.style.pointerEvents = 'none';
            downloadLink.innerHTML = '<i class="bi bi-arrow-repeat spinner-spin me-2"></i> Fetching File...';
            downloadLink.classList.add('opacity-75');

            try {
                const response = await fetch(`/cdn/${fileName}`);

                if (response.ok) {
                    // Trigger dynamic browser download
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = originalName;
                    document.body.appendChild(a);
                    a.click();
                    
                    // Cleanup
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);

                    // Restore button state
                    downloadLink.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Download Complete!';
                    setTimeout(() => {
                        downloadLink.innerHTML = originalHtml;
                        downloadLink.style.pointerEvents = 'auto';
                        downloadLink.classList.remove('opacity-75');
                    }, 2000);
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Server responded with an error status.');
                }
            } catch (error) {
                console.error('Download error:', error);
                
                // Restore button state on failure
                downloadLink.innerHTML = originalHtml;
                downloadLink.style.pointerEvents = 'auto';
                downloadLink.classList.remove('opacity-75');

                if (errorBox) {
                    errorBox.textContent = 'Could not retrieve file. It may have expired or been deleted.';
                    errorBox.style.display = 'block';
                    errorBox.classList.add('animate-shake');
                    setTimeout(() => errorBox.classList.remove('animate-shake'), 500);
                }
            }
        });
    }
});
