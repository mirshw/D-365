document.addEventListener("DOMContentLoaded", function () {
    const photoForm = document.getElementById('upload-form');
    const gallery = document.getElementById('gallery');

    let db;
    const request = indexedDB.open("photoGalleryDB", 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        db.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        loadPhotos();
    };

    request.onerror = function (event) {
        console.error("Database error:", event.target.errorCode);
    };

    photoForm.addEventListener('submit', function (event) {
        event.preventDefault();
        uploadPhoto();
    });

    function uploadPhoto() {
        const fileInput = document.getElementById('photo-upload');
        const titleInput = document.getElementById('photo-title');

        const file = fileInput.files[0];
        const title = titleInput.value.trim();

        if (file && title) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const photoData = {
                    title: title,
                    src: e.target.result
                };

                const transaction = db.transaction(["photos"], "readwrite");
                const objectStore = transaction.objectStore("photos");
                const request = objectStore.add(photoData);

                request.onsuccess = function () {
                    displayPhoto(photoData);
                };

                request.onerror = function (event) {
                    console.error("Error storing photo:", event.target.errorCode);
                };

                fileInput.value = '';
                titleInput.value = '';
            };
            reader.readAsDataURL(file);
        } else {
            alert("사진을 업로드하고 제목을 입력해 주세요.");
        }
    }

    function loadPhotos() {
        const transaction = db.transaction("photos", "readonly");
        const objectStore = transaction.objectStore("photos");
        const request = objectStore.getAll();

        request.onsuccess = function () {
            request.result.forEach((photo) => displayPhoto(photo));
        };

        request.onerror = function () {
            console.error("Error fetching photos from the database.");
        };
    }

    function displayPhoto(photo) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.title;

        const title = document.createElement('h3');
        title.contentEditable = true;
        title.textContent = photo.title;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = '🗑';
        deleteButton.style.position = "absolute";
        deleteButton.style.top = "10px";
        deleteButton.style.right = "10px";
        deleteButton.addEventListener('click', function () {
            deletePhoto(photo.id, galleryItem);
        });

        title.addEventListener('input', function () {
            const transaction = db.transaction(["photos"], "readwrite");
            const objectStore = transaction.objectStore("photos");
            const request = objectStore.get(photo.id);

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

    function deletePhoto(id, galleryItem) {
        const transaction = db.transaction(["photos"], "readwrite");
        const objectStore = transaction.objectStore("photos");

        const request = objectStore.delete(id);

        request.onsuccess = function () {
            console.log("사진이 데이터베이스에서 삭제되었습니다.");
            galleryItem.remove();
        };

        request.onerror = function (event) {
            console.error("사진을 삭제하는 중 오류 발생:", event.target.errorCode);
        };
    }
});
