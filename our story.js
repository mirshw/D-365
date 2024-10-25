document.addEventListener('DOMContentLoaded', function() {
    const storyForm = document.getElementById('story-form');
    const timeline = document.getElementById('timeline');

    function loadStories() {
        const stories = JSON.parse(localStorage.getItem('stories')) || [];
        stories.forEach(story => {
            addStoryToDOM(story.title, story.description, story.id);
        });
    }

    function addStoryToDOM(title, description, storyId) {
        const storyDiv = document.createElement('div');
        storyDiv.classList.add('event');
        storyDiv.dataset.id = storyId;
        storyDiv.innerHTML = `
            <h3 contenteditable="false">${title}</h3>
            <p contenteditable="false">${description}</p>
            <div class="button-container">
                <button class="edit-moment" data-id="${storyId}">🖋</button>
                <button class="delete-moment" data-id="${storyId}">🗑</button>
                <button class="save-moment" data-id="${storyId}" style="display: none;">☑</button>
                <button class="cancel-moment" data-id="${storyId}" style="display: none;">☒</button>
            </div>
            <div class="comments">
                <div class="comment-list" id="event-${storyId}-comments">
                    <!-- Comments will appear here -->
                </div>
                <form class="comment-form" id="event-${storyId}-form">
                    <input type="text" placeholder="Your Name" class="comment-name" required>
                    <textarea placeholder="Your Comment" class="comment-message" required></textarea>
                    <button type="submit">Add Comment</button>
                </form>
            </div>
        `;
        timeline.appendChild(storyDiv);

        loadComments(storyId);

        const editButton = storyDiv.querySelector('.edit-moment');
        const deleteButton = storyDiv.querySelector('.delete-moment');
        const saveButton = storyDiv.querySelector('.save-moment');
        const cancelButton = storyDiv.querySelector('.cancel-moment');

        editButton.addEventListener('click', () => enterEditMode(storyDiv));
        deleteButton.addEventListener('click', () => deleteStory(storyId));
        saveButton.addEventListener('click', () => saveChanges(storyDiv));
        cancelButton.addEventListener('click', () => exitEditMode(storyDiv, title, description));
    }

    function enterEditMode(storyDiv) {
        const h3 = storyDiv.querySelector('h3');
        const p = storyDiv.querySelector('p');
        const editButton = storyDiv.querySelector('.edit-moment');
        const saveButton = storyDiv.querySelector('.save-moment');
        const cancelButton = storyDiv.querySelector('.cancel-moment');

        h3.contentEditable = true;
        p.contentEditable = true;

        editButton.style.display = 'none';
        saveButton.style.display = 'inline';
        cancelButton.style.display = 'inline';
    }

    function exitEditMode(storyDiv, originalTitle, originalDescription) {
        const h3 = storyDiv.querySelector('h3');
        const p = storyDiv.querySelector('p');
        const editButton = storyDiv.querySelector('.edit-moment');
        const saveButton = storyDiv.querySelector('.save-moment');
        const cancelButton = storyDiv.querySelector('.cancel-moment');

        h3.contentEditable = false;
        p.contentEditable = false;

        h3.textContent = originalTitle;
        p.textContent = originalDescription;

        editButton.style.display = 'inline';
        saveButton.style.display = 'none';
        cancelButton.style.display = 'none';
    }

    function saveChanges(storyDiv) {
        const h3 = storyDiv.querySelector('h3');
        const p = storyDiv.querySelector('p');
        const storyId = storyDiv.dataset.id;

        updateStoryInDOM(storyId, h3.textContent, p.textContent);
        saveStories();

        h3.contentEditable = false;
        p.contentEditable = false;

        storyDiv.querySelector('.edit-moment').style.display = 'inline';
        storyDiv.querySelector('.save-moment').style.display = 'none';
        storyDiv.querySelector('.cancel-moment').style.display = 'none';
    }

    function loadComments(storyId) {
        const comments = JSON.parse(localStorage.getItem(`comments-${storyId}`)) || [];
        const commentList = document.getElementById(`event-${storyId}-comments`);
        commentList.innerHTML = ''; 
        comments.forEach((comment, index) => {
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');
            commentElement.innerHTML = `
                <p><strong>${comment.name}:</strong> ${comment.message}</p>
                <div class="button-container">
                    <button class="edit-comment" data-story-id="${storyId}" data-comment-index="${index}">🖋</button>
                    <button class="delete-comment" data-story-id="${storyId}" data-comment-index="${index}">🗑</button>
                </div>
            `;
            commentList.appendChild(commentElement);
        });
    }

    function updateStoryInDOM(storyId, newTitle, newDescription) {
        const storyDiv = document.querySelector(`.event[data-id="${storyId}"]`);
        if (storyDiv) {
            storyDiv.querySelector('h3').textContent = newTitle;
            storyDiv.querySelector('p').textContent = newDescription;
        }
    }

    function saveStories() {
        const stories = [];
        document.querySelectorAll('.event').forEach(story => {
            const title = story.querySelector('h3').textContent;
            const description = story.querySelector('p').textContent;
            const storyId = story.dataset.id;
            stories.push({ title, description, id: storyId });
        });
        localStorage.setItem('stories', JSON.stringify(stories));
    }

    function deleteStory(storyId) {
        const storyDiv = document.querySelector(`.event[data-id="${storyId}"]`);
        if (storyDiv) {
            storyDiv.remove();
        }

        // Remove associated comments
        localStorage.removeItem(`comments-${storyId}`);

        // Update the stories in local storage
        saveStories();
    }

    storyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const storyId = Date.now().toString();
        addStoryToDOM(title, description, storyId);
        saveStories();
        document.getElementById('event-title').value = '';
        document.getElementById('event-description').value = '';
    });

    timeline.addEventListener('submit', function(e) {
        if (e.target && e.target.classList.contains('comment-form')) {
            e.preventDefault();
            const form = e.target;
            const storyId = form.id.split('-')[1];
            const commentName = form.querySelector('.comment-name').value;
            const commentMessage = form.querySelector('.comment-message').value;

            if (commentName.trim() === '' || commentMessage.trim() === '') {
                alert('Name and Comment are required!');
                return;
            }

            const commentList = document.getElementById(`event-${storyId}-comments`);
            const newComment = document.createElement('div');
            newComment.classList.add('comment-item');
            newComment.innerHTML = `
                <p><strong>${commentName}:</strong> ${commentMessage}</p>
                <div class="button-container">
                    <button class="edit-comment" data-story-id="${storyId}" data-comment-index="${commentList.children.length}">🖋</button>
                    <button class="delete-comment" data-story-id="${storyId}" data-comment-index="${commentList.children.length}">🗑</button>
                </div>
            `;
            commentList.appendChild(newComment);

            addComment(storyId, commentName, commentMessage);
            form.reset();
        }
    });

    function addComment(storyId, name, message) {
        const comments = JSON.parse(localStorage.getItem(`comments-${storyId}`)) || [];
        comments.push({ name, message });
        localStorage.setItem(`comments-${storyId}`, JSON.stringify(comments));
    }

    timeline.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('edit-comment')) {
            const storyId = e.target.dataset.storyId;
            const commentIndex = e.target.dataset.commentIndex;
            const commentElement = e.target.closest('.comment-item');
        
            const comment = JSON.parse(localStorage.getItem(`comments-${storyId}`))[commentIndex];
            commentElement.innerHTML = `
                <form class="edit-comment-form">
                    <input type="text" class="comment-name-edit" value="${comment.name}" required>
                    <textarea class="comment-message-edit" required>${comment.message}</textarea>
                    <div class="button-container">
                        <button type="button" class="delete-comment-edit" data-story-id="${storyId}" data-comment-index="${commentIndex}">🗑</button>
                        <button type="submit" class="save-comment-edit" data-story-id="${storyId}" data-comment-index="${commentIndex}">☑</button>
                        <button type="button" class="cancel-comment-edit">☒</button>
                    </div>
                </form>
            `;
        }

        if (e.target && e.target.classList.contains('save-comment-edit')) {
            e.preventDefault();
            const storyId = e.target.dataset.storyId;
            const commentIndex = e.target.dataset.commentIndex;
            const commentElement = e.target.closest('.edit-comment-form');
            const name = commentElement.querySelector('.comment-name-edit').value;
            const message = commentElement.querySelector('.comment-message-edit').value;

            updateComment(storyId, commentIndex, name, message);
            loadComments(storyId);
        }

        if (e.target && e.target.classList.contains('cancel-comment-edit')) {
            const storyId = e.target.closest('.event').dataset.id;
            loadComments(storyId);
        }

        if (e.target && e.target.classList.contains('delete-comment-edit')) {
            const storyId = e.target.dataset.storyId;
            const commentIndex = e.target.dataset.commentIndex;
            deleteComment(storyId, commentIndex);
            loadComments(storyId);
        }

        if (e.target && e.target.classList.contains('delete-comment')) {
            const storyId = e.target.dataset.storyId;
            const commentIndex = e.target.dataset.commentIndex;
            deleteComment(storyId, commentIndex);
            loadComments(storyId);
        }
    });

    function updateComment(storyId, commentIndex, name, message) {
        const comments = JSON.parse(localStorage.getItem(`comments-${storyId}`)) || [];
        comments[commentIndex] = { name, message };
        localStorage.setItem(`comments-${storyId}`, JSON.stringify(comments));
    }

    function deleteComment(storyId, commentIndex) {
        const comments = JSON.parse(localStorage.getItem(`comments-${storyId}`)) || [];
        comments.splice(commentIndex, 1);
        localStorage.setItem(`comments-${storyId}`, JSON.stringify(comments));
    }

    loadStories();
});
