// views/scripts/view.js

document.addEventListener('DOMContentLoaded', () => {
    const mediaDisplayArea = document.querySelector('.media-display-area');
    const filenameDisplay = document.querySelector('.filename-display');
    const loadingSpinnerArea = document.querySelector('.loading-spinner-area');

    const fileName = filenameDisplay ? filenameDisplay.dataset.fileName : '';
    const apiLink = mediaDisplayArea ? mediaDisplayArea.dataset.apiLink : '';

    if (!mediaDisplayArea || !fileName || !apiLink) {
        console.error("Missing essential elements or data for media viewer. Aborting.");
        if (mediaDisplayArea) {
             mediaDisplayArea.innerHTML = `
                <div class="media-unsupported text-danger">
                    <i class="bi bi-x-circle-fill unsupported-icon text-danger"></i>
                    <p>Viewer data missing. Cannot display preview.</p>
                </div>
            `;
        }
        return;
    }

    const fileExtension = fileName.split('.').pop().toLowerCase();
    let mediaElement = null;
    let typeDetected = false;

    if (loadingSpinnerArea) {
        loadingSpinnerArea.style.display = 'none'; // Hide initial spinner
    }

    // Function to handle media loading errors
    const handleMediaError = (element, specificMessage = 'Unknown error') => {
        console.error(`Error loading media resource for ${fileName}: ${element.src}. Message: ${specificMessage}`);
        mediaDisplayArea.innerHTML = `
            <div class="media-unsupported text-danger">
                <i class="bi bi-exclamation-triangle-fill unsupported-icon text-danger mb-3"></i>
                <h4 class="text-light mb-2">Preview Generation Failed</h4>
                <p class="text-muted small">The file could not be rendered directly in the browser.</p>
                <p class="text-muted small">Details: ${specificMessage}</p>
            </div>
        `;
    };

    // Determine media type and create element
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
        mediaElement = document.createElement('img');
        mediaElement.className = 'media-content image-viewer';
        mediaElement.src = apiLink;
        mediaElement.alt = 'Image Preview';
        mediaElement.onload = () => {
            console.log('Image loaded successfully.');
        };
        mediaElement.addEventListener('error', () => handleMediaError(mediaElement, 'Image load failed.'));
        typeDetected = true;
    } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) { // Video formats
        mediaElement = document.createElement('video');
        mediaElement.className = 'media-content video-viewer';
        mediaElement.src = apiLink;
        mediaElement.controls = true;
        mediaElement.autoplay = false;
        mediaElement.muted = false;
        mediaElement.setAttribute('playsinline', '');
        mediaElement.addEventListener('loadeddata', () => {
            console.log('Video loaded successfully.');
        });
        mediaElement.addEventListener('error', (e) => handleMediaError(mediaElement, 'Video load failed.'));
        typeDetected = true;
    } else if (['mp3', 'wav', 'aac', 'ogg', 'flac'].includes(fileExtension)) { // Audio formats
        mediaElement = document.createElement('audio');
        mediaElement.className = 'media-content audio-viewer';
        mediaElement.src = apiLink;
        mediaElement.controls = true;
        mediaElement.autoplay = false;
        mediaElement.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully.');
        });
        mediaElement.addEventListener('error', (e) => handleMediaError(mediaElement, 'Audio load failed.'));
        typeDetected = true;
    } else if (['txt', 'md', 'log', 'json', 'html', 'css', 'js', 'xml', 'pdf'].includes(fileExtension)) { // Text/Document formats
        mediaElement = document.createElement('iframe');
        mediaElement.className = 'media-content text-viewer';
        mediaElement.src = apiLink;
        mediaElement.frameBorder = '0';
        mediaElement.addEventListener('load', () => {
            console.log('Iframe loaded.');
        });
        mediaElement.addEventListener('error', (e) => handleMediaError(mediaElement, 'Document load failed.'));
        typeDetected = true;
    }

    if (typeDetected && mediaElement) {
        mediaDisplayArea.innerHTML = ''; // Clear loading spinner
        mediaDisplayArea.appendChild(mediaElement);
        mediaElement.style.display = 'block';
    } else {
        console.warn(`No specific viewer found for .${fileExtension}. Displaying fallback.`);
        mediaDisplayArea.innerHTML = `
            <div class="media-unsupported">
                <i class="bi bi-file-earmark-lock unsupported-icon text-muted mb-3"></i>
                <h4 class="text-light mb-2">No Preview Available</h4>
                <p class="text-muted small">Files of type .${fileExtension} cannot be previewed in browser.</p>
                <p class="text-muted small">Please use the Download button below to access this file.</p>
            </div>
        `;
    }
});
