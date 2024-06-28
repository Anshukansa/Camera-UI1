document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('login-button');
    const popupContainer = document.getElementById('start-session-popup');
    const usernameInput = document.getElementById('username-input');
    const sessionSubmitButton = document.getElementById('session-submit-button');
    const logoutButton = document.getElementById('logout-button');
    const flashToggleButton = document.getElementById('flash-toggle-button');
    const capturePhotoButton = document.getElementById('capture-photo-button');
    const galleryButton = document.getElementById('gallery-button');
    const videoElement = document.getElementById('video');
    const switchCameraButton = document.getElementById('switch-camera-button');
    const photosContainer = document.getElementById('photos-container');
    const dbName = 'CleanCamPhotos';

    // Check session status on page load
    checkSessionStatus();

    // Show popup on login button click
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            popupContainer.classList.remove('hidden');
            popupContainer.classList.add('flex');
        });
    }

    // Handle session submit
    if (sessionSubmitButton) {
        sessionSubmitButton.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            if (username) {
                localStorage.setItem('loggedIn', 'true');
                localStorage.setItem('username', username);
                window.location.href = 'capture.html';
            }
        });
    }

    // Handle logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('loggedIn');
                localStorage.removeItem('username');
                window.location.href = 'index.html';
            }
        });
    }

    // Handle flash toggle
    if (flashToggleButton) {
        flashToggleButton.addEventListener('click', () => {
            // Flash toggle functionality here (depends on device capability)
            alert('Flash toggle functionality is not implemented in this demo.');
        });
    }

    // Handle switch camera
    if (switchCameraButton) {
        switchCameraButton.addEventListener('click', () => {
            switchCamera();
        });
    }

    // Function to switch camera
    function switchCamera() {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                if (videoDevices.length > 1) {
                    // Toggle between the available video devices
                    const currentDeviceId = videoElement.srcObject.getVideoTracks()[0].getSettings().deviceId;
                    let nextDeviceId = videoDevices.find(device => device.deviceId !== currentDeviceId)?.deviceId || videoDevices[0].deviceId;
                    
                    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: nextDeviceId } } })
                        .then(stream => {
                            videoElement.srcObject = stream;
                            videoElement.play();
                        })
                        .catch(err => {
                            console.error('Error switching camera:', err);
                        });
                } else {
                    alert('No other cameras available to switch.');
                }
            })
            .catch(err => {
                console.error('Error enumerating video devices:', err);
            });
    }

    // Handle capture photo
    if (capturePhotoButton) {
        capturePhotoButton.addEventListener('click', capturePhoto);
    }

    // Redirect to gallery page
    if (galleryButton) {
        galleryButton.addEventListener('click', () => {
            window.location.href = 'gallery.html';
        });
    }

    // Initialize video stream
    initVideoStream();

    // Function to check session status
    function checkSessionStatus() {
        if (localStorage.getItem('loggedIn') === 'true') {
            const currentPage = window.location.pathname.split('/').pop();
            const isIndexPage = currentPage === '' || currentPage === 'index.html';
            if (isIndexPage) {
                window.location.href = 'capture.html';
            }
        }
    }

    // Function to initialize video stream
    function initVideoStream() {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoElement.srcObject = stream;
                videoElement.play();
            })
            .catch(err => {
                console.error('Error accessing media devices.', err);
            });
    }

    // Function to capture photo from video stream
    function capturePhoto() {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageDataURL = canvas.toDataURL('image/png');
        
        // Here you can save the imageDataURL to IndexedDB or perform any other action with the captured photo
        savePhoto(imageDataURL);
    }

    // Function to save a photo to IndexedDB
function savePhoto(imageData) {
    const request = indexedDB.open(dbName, 1);
    let db;

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        const objectStore = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('imageData', 'imageData');
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        const transaction = db.transaction('photos', 'readwrite');
        const objectStore = transaction.objectStore('photos');
        const photo = { imageData: imageData };

        const request = objectStore.add(photo);
        request.onsuccess = function() {
            console.log('Photo saved to IndexedDB.');
            // Display updated photos after saving
            displayPhotos(); // Ensure this triggers display correctly
        };

        request.onerror = function(event) {
            console.error('Error saving photo to IndexedDB:', event.target.error);
        };
    };

    request.onerror = function(event) {
        console.error('Error opening IndexedDB:', event.target.error);
    };
}


 // Function to display saved photos from IndexedDB
function displayPhotos() {
    const request = indexedDB.open(dbName, 1);
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction('photos', 'readonly');
        const objectStore = transaction.objectStore('photos');
        const photos = [];

        objectStore.openCursor().onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                photos.push(cursor.value);
                cursor.continue();
            } else {
                console.log('Photos retrieved from IndexedDB:', photos); // Log to check for duplicates
                renderPhotos(photos); // Ensure rendering happens once with unique photos
            }
        };
    };

    request.onerror = function(event) {
        console.error('Error opening IndexedDB:', event.target.error);
    };
}


   // Function to render photos in the DOM
function renderPhotos(photos) {
    photosContainer.innerHTML = ''; // Clear previous content

    photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo.imageData;
        img.alt = 'Captured Photo';
        img.classList.add('w-full', 'max-h-[400px]', 'object-contain', 'mb-4');
        photosContainer.appendChild(img);
    });
}

    // Call function to display photos on page load
    displayPhotos();

    // Add functionality for Share All button
    const shareAllButton = document.getElementById('shareAll-button');
    if (shareAllButton) {
        shareAllButton.addEventListener('click', () => {
            const confirmation = confirm('Are you sure you want to share all photos?');
            if (confirmation) {
                // Implement sharing logic here (e.g., upload photos to a server or call an API)
                // Placeholder alert for demonstration
                alert('Photos shared successfully.');
            }
        });
    }

    // Add functionality for Delete All button
    const deleteAllButton = document.getElementById('deleteAll-button');
    if (deleteAllButton) {
        deleteAllButton.addEventListener('click', () => {
            const confirmation = confirm('Are you sure you want to delete all photos?');
            if (confirmation) {
                // Implement deletion logic here (e.g., clear photos from IndexedDB)
                deleteAllPhotosFromIndexedDB();
            }
        });
    }

    // Function to delete all photos from IndexedDB
    function deleteAllPhotosFromIndexedDB() {
        const request = indexedDB.open(dbName, 1);
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction('photos', 'readwrite');
            const objectStore = transaction.objectStore('photos');
            
            objectStore.clear();
            
            transaction.oncomplete = function() {
                console.log('All photos deleted from IndexedDB.');
                // Optionally, update UI after deletion (e.g., refresh photo display)
                photosContainer.innerHTML = ''; // Clear photos from UI
            };
            
            transaction.onerror = function(event) {
                console.error('Error deleting photos from IndexedDB:', event.target.error);
            };
        };
        
        request.onerror = function(event) {
            console.error('Error opening IndexedDB:', event.target.error);
        };
    }
});
