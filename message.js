document.addEventListener("DOMContentLoaded", function () {
    const messageForms = [
        { form: 'message-upload-form-j', fileInput: 'message-photo-upload-j', titleInput: 'message-photo-title-j', gallery: 'jim-message-gallery' },
        { form: 'message-upload-form-l', fileInput: 'message-photo-upload-l', titleInput: 'message-photo-title-l', gallery: 'other-message-gallery' }
    ];

    let db;
    const request = indexedDB.open("messageGalleryDB", 2);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("messages")) {
            db.createObjectStore("messages", { keyPath: "id", autoIncrement: true });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        if (db) {
            loadMessages();
        }
    };

    request.onerror = function (event) {
        console.error("Database error:", event.target.errorCode);
    };

    messageForms.forEach(({ form, fileInput, titleInput, gallery }) => {
        document.getElementById(form).addEventListener('submit', function (event) {
            event.preventDefault();
            uploadMessage(fileInput, titleInput, gallery);
        });
    });

    function uploadMessage(fileInputId, titleInputId, galleryId) {
        const fileInput = document.getElementById(fileInputId);
        const titleInput = document.getElementById(titleInputId);

        const file = fileInput.files[0];
        const title = titleInput.value.trim();

        if (file && title) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const messageData = {
                    title: title,
                    src: e.target.result,
                    gallery: galleryId
                };

                const transaction = db.transaction(["messages"], "readwrite");
                const objectStore = transaction.objectStore("messages");
                const addRequest = objectStore.add(messageData);

                addRequest.onsuccess = function () {
                    loadMessages();
                };

                addRequest.onerror = function (event) {
                    console.error("Error storing message:", event.target.errorCode);
                };

                fileInput.value = '';
                titleInput.value = '';
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a photo and enter a title.");
        }
    }

    function loadMessages() {
        const transaction = db.transaction("messages", "readonly");
        const objectStore = transaction.objectStore("messages");
        const request = objectStore.getAll();

        request.onsuccess = function () {
            // 각 갤러리의 내용을 초기화하여 중복 표시 방지
            const jimGallery = document.getElementById('jim-message-gallery');
            const otherGallery = document.getElementById('other-message-gallery');
            while (jimGallery.firstChild) {
                jimGallery.removeChild(jimGallery.firstChild);
            }
            while (otherGallery.firstChild) {
                otherGallery.removeChild(otherGallery.firstChild);
            }

            request.result.forEach((message) => {
                displayMessage(message);
            });
        };

        request.onerror = function () {
            console.error("Error fetching messages from the database.");
        };
    }

    function displayMessage(message) {
        const gallery = document.getElementById(message.gallery);
        if (!gallery) return;

        const galleryItem = document.createElement('div');
        galleryItem.className = 'message-gallery-item';
        galleryItem.dataset.id = message.id;

        const img = document.createElement('img');
        img.src = message.src;
        img.alt = message.title;

        const title = document.createElement('h3');
        title.contentEditable = true;
        title.textContent = message.title;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = '🗑';
        deleteButton.style.position = "absolute";
        deleteButton.style.top = "10px";
        deleteButton.style.right = "10px";
        deleteButton.addEventListener('click', function () {
            deleteMessage(message.id, galleryItem);
        });

        title.addEventListener('input', function () {
            const transaction = db.transaction(["messages"], "readwrite");
            const objectStore = transaction.objectStore("messages");
            const request = objectStore.get(message.id);

            request.onsuccess = function () {
                const data = request.result;
                data.title = title.textContent;
                objectStore.put(data);
            };
        });

        galleryItem.style.position = "relative";
        galleryItem.appendChild(img);
        galleryItem.appendChild(title);
        galleryItem.appendChild(deleteButton);

        gallery.appendChild(galleryItem);
    }

    function deleteMessage(id, galleryItem) {
        const transaction = db.transaction(["messages"], "readwrite");
        const objectStore = transaction.objectStore("messages");

        const request = objectStore.delete(id);

        request.onsuccess = function () {
            galleryItem.remove();
        };

        request.onerror = function (event) {
            console.error("Error deleting message:", event.target.errorCode);
        };
    }
});
