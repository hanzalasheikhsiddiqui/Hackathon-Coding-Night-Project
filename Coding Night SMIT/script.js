let currentEditingPostId = null;
let currentViewingPostId = null; 


const STORAGE_USERS = 'matebook_users';
const STORAGE_POSTS = 'matebook_posts';
const STORAGE_LOGGED_IN_USER = 'matebook_loggedInUser';
const STORAGE_COMMENTS = 'matebook_comments'; 

const authView = document.getElementById('auth-view');
const feedView = document.getElementById('feed-view');
const profileModal = document.getElementById('profile-modal'); 
const postsContainer = document.getElementById('posts-container');
const editUsernameInput = document.getElementById('edit-username');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const profileUpdateMsg = document.getElementById('profile-update-msg');
const sortButtons = document.querySelectorAll('.sort-options span');

let loggedInUser = null;
let currentSort = 'latest';


function getData(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function showView(viewId) {
    authView.style.display = 'none';
    feedView.style.display = 'none'; 
    profileModal.style.display = 'none'; 
    
    const targetView = document.getElementById(viewId);
    
    if (targetView) {
        if (viewId === 'auth-view') { 
            targetView.style.display = 'flex'; 
            window.scrollTo(0, 0); 
            postsContainer.innerHTML = '';
        } else {
            targetView.style.display = 'block'; }
    }
    
    if (viewId === 'feed-view') {
        loadPosts();
    }
}

function updateHeaderUsername() {
    const usernameElement = document.getElementById('header-username');
    if (loggedInUser) {
        usernameElement.textContent = loggedInUser;
    } else {
        usernameElement.textContent = '';
    }
}

window.onload = function() {
    const username = localStorage.getItem(STORAGE_LOGGED_IN_USER);
    if (username) {
        loggedInUser = username;
        updateHeaderUsername();
        showView('feed-view');
    } else {
        showView('auth-view');
    }

    const imageFileInput = document.getElementById('post-image-file');
    const fileNameDisplay = document.getElementById('file-name-display');

    if (imageFileInput) {
        imageFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileNameDisplay.textContent = e.target.files[0].name;
            } else {
                fileNameDisplay.textContent = '';
            }
        });
    }
};


window.onclick = function(event) {
    if (!event.target.matches('.fa-ellipsis-v')) {
        const dropdowns = document.getElementsByClassName("options-dropdown");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.style.display === 'block') {
                openDropdown.style.display = 'none';
            }
        }
    }
    if (event.target.matches('#edit-modal')) {
        closeEditModal();
    }
    if (event.target.matches('#comments-modal')) {
        closeCommentsModal();
    }
    if (event.target === profileModal) { 
        closeProfileModal();
    }
}

function togglePostOptions(postId, event) {
    const dropdowns = document.getElementsByClassName("options-dropdown");
    for (let i = 0; i < dropdowns.length; i++) {
        const openDropdown = dropdowns[i];
        if (openDropdown.style.display === 'block') {
            openDropdown.style.display = 'none';
        }
    }

    const dropdown = document.getElementById(`dropdown-${postId}`);
    if (dropdown) {
        dropdown.style.display = 'block';
    }
    event.stopPropagation();
}


function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    loginError.textContent = '';
    signupError.textContent = '';
}

function showLogin() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    loginError.textContent = '';
    signupError.textContent = '';
}

function handleSignup() {
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    
    signupError.textContent = '';

    if (!username || !email || !password) {
        signupError.textContent = 'All fields are required.';
        return;
    }

    let users = getData(STORAGE_USERS);
    
    if (users.some(user => user.email === email || user.username === username)) {
        signupError.textContent = 'User already exists.';
        return;
    }

    const newUser = { username, email, password };
    users.push(newUser);
    saveData(STORAGE_USERS, users);

    loggedInUser = username;
    localStorage.setItem(STORAGE_LOGGED_IN_USER, username);
    
    updateHeaderUsername();
    showView('feed-view');
}

function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    loginError.textContent = '';
    
    if (!email || !password) {
        loginError.textContent = 'Email and Password are required.';
        return;
    }
    
    let users = getData(STORAGE_USERS);
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        loggedInUser = user.username;
        localStorage.setItem(STORAGE_LOGGED_IN_USER, user.username);
        
        updateHeaderUsername();
        showView('feed-view');
    } else {
        loginError.textContent = 'Invalid email or password';
    }
}

function handleLogout() {
    closeProfileModal(); 
    
    loggedInUser = null;
    localStorage.removeItem(STORAGE_LOGGED_IN_USER);
    
    updateHeaderUsername(); 
    showLogin(); 
    showView('auth-view'); 
}

function insertEmoji(emoji) {
    const textarea = document.getElementById('new-post-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    textarea.value = textarea.value.substring(0, start) + emoji + textarea.value.substring(end);
    
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    textarea.focus();
}


function savePostToStorage(content, imageUrl) {
    let posts = getData(STORAGE_POSTS);
    const newPost = {
        id: Date.now(),
        username: loggedInUser,
        content: content,
        imageUrl: imageUrl, 
        timestamp: Date.now(),
        likes: 0,
        likedBy: [], 
        comments: 0 
    };
    
    posts.unshift(newPost);
    saveData(STORAGE_POSTS, posts);
}

function submitPost() {
    const content = document.getElementById('new-post-content').value.trim();
    const urlInput = document.getElementById('post-image-url');
    const fileInput = document.getElementById('post-image-file');
    const fileNameDisplay = document.getElementById('file-name-display');

    if (!content && !urlInput.value.trim() && fileInput.files.length === 0) return;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            savePostToStorage(content, e.target.result); 

            document.getElementById('new-post-content').value = '';
            urlInput.value = '';
            fileInput.value = '';
            fileNameDisplay.textContent = '';
            
            loadPosts();
        };
        reader.readAsDataURL(file); 

    } else {
        savePostToStorage(content, urlInput.value.trim());

        document.getElementById('new-post-content').value = '';
        urlInput.value = '';
        fileNameDisplay.textContent = ''; 
        
        loadPosts();
    }
}

function sortPosts(type) {
    currentSort = type;
    
    sortButtons.forEach(btn => btn.classList.remove('active'));
    document.getElementById(`sort-${type}`).classList.add('active');

    loadPosts();
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toggleLike(postId) {
    if (!loggedInUser) return;
    
    let posts = getData(STORAGE_POSTS);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex > -1) {
        const post = posts[postIndex];
        const likedBy = post.likedBy || [];
        const userIndex = likedBy.indexOf(loggedInUser);

        if (userIndex > -1) {
            likedBy.splice(userIndex, 1); 
            post.likes -= 1;
        } else {
            likedBy.push(loggedInUser); 
            post.likes += 1;
        }
        
        post.likedBy = likedBy;
        saveData(STORAGE_POSTS, posts);
        loadPosts();
    }
}

function loadPosts() {
    let posts = getData(STORAGE_POSTS);
    
    if (currentSort === 'latest') {
        posts.sort((a, b) => b.timestamp - a.timestamp);
    } else if (currentSort === 'oldest') {
        posts.sort((a, b) => a.timestamp - b.timestamp);
    } else if (currentSort === 'popular') {
        posts.sort((a, b) => b.likes - a.likes);
    }
    
    postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p>Be the first one to post!</p>';
        return;
    }
    
    posts.forEach(post => {
        postsContainer.appendChild(renderPost(post));
    });
}

function renderPost(post) {
    const isLiked = post.likedBy && post.likedBy.includes(loggedInUser);
    const likeClass = isLiked ? 'liked' : '';
    const isUsersPost = post.username === loggedInUser; 
    
    const postElement = document.createElement('div');
    postElement.className = 'post-item';
    
    const imageHtml = post.imageUrl 
        ? `<img src="${post.imageUrl}" alt="Post Image" class="post-image" onerror="this.style.display='none'">`
        : '';
        
    const postOptionsHtml = isUsersPost ? `
        <div class="post-options">
            <i class="fas fa-ellipsis-v" onclick="togglePostOptions(${post.id}, event)"></i>
            <div class="options-dropdown" id="dropdown-${post.id}">
                <span onclick="openEditModal(${post.id})">Edit Post</span>
                <span class="delete" onclick="deletePost(${post.id})">Delete Post</span>
            </div>
        </div>
    ` : '';
        
    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${post.username.charAt(0).toUpperCase()}</div>
            <div class="post-info">
                <strong>${post.username}</strong>
                <small>${formatTime(post.timestamp)}</small>
            </div>
            
            ${postOptionsHtml} 
        </div>
        
        <div class="post-content">${post.content}</div>
        ${imageHtml}
        <div class="post-actions">
            <span class="action-button ${likeClass}" onclick="toggleLike(${post.id})">
                <i class="fas fa-heart"></i>
                <span id="like-count-${post.id}">${post.likes}</span>
            </span>
            <span class="action-button" onclick="openCommentsModal(${post.id})">
                <i class="fas fa-comment"></i>
                <span>${post.comments}</span>
            </span>
        </div>
    `;
    
    return postElement;
}


// --- EDIT/DELETE LOGIC ---

function deletePost(postId) {
    if (confirm("Are you sure you want to delete this post?")) {
        let posts = getData(STORAGE_POSTS);
        posts = posts.filter(post => post.id !== postId);
        saveData(STORAGE_POSTS, posts);
        loadPosts();
    }
}

function openEditModal(postId) {
    
    let posts = getData(STORAGE_POSTS);
    const post = posts.find(p => p.id === postId);

    if (post) {
        currentEditingPostId = postId;
        document.getElementById('edit-post-content').value = post.content;
        document.getElementById('edit-post-image-url').value = post.imageUrl || '';
        document.getElementById('edit-error').textContent = '';
        document.getElementById('edit-modal').style.display = 'flex';
    }
    const dropdown = document.getElementById(`dropdown-${postId}`);
    if(dropdown) dropdown.style.display = 'none';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    currentEditingPostId = null;
}

function saveEditedPost() {
    if (!currentEditingPostId) return;

    const newContent = document.getElementById('edit-post-content').value.trim();
    const newImageUrl = document.getElementById('edit-post-image-url').value.trim();

    if (!newContent && !newImageUrl) {
        document.getElementById('edit-error').textContent = 'Post cannot be empty.';
        return;
    }

    let posts = getData(STORAGE_POSTS);
    const postIndex = posts.findIndex(p => p.id === currentEditingPostId);

    if (postIndex > -1) {
        posts[postIndex].content = newContent;
        posts[postIndex].imageUrl = newImageUrl;
        
        saveData(STORAGE_POSTS, posts);
        closeEditModal();
        loadPosts();
    }
}


function openCommentsModal(postId) {
    if (!loggedInUser) return;
    
    currentViewingPostId = postId;
    document.getElementById('new-comment-content').value = '';
    
    loadComments(postId);
    document.getElementById('comments-modal').style.display = 'flex';
}

function closeCommentsModal() {
    document.getElementById('comments-modal').style.display = 'none';
    currentViewingPostId = null;
}

function loadComments(postId) {
    const allComments = getData(STORAGE_COMMENTS);
    const postComments = allComments.filter(c => c.postId === postId);
    const commentsList = document.getElementById('comments-list');
    
    commentsList.innerHTML = '';

    if (postComments.length === 0) {
        commentsList.innerHTML = '<p style="text-align: center; color: #666;">No comments yet.</p>';
        return;
    }

    postComments.sort((a, b) => a.timestamp - b.timestamp);

    postComments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        commentElement.innerHTML = `
            <span class="comment-user">${comment.username}:</span> 
            <span class="comment-content">${comment.content}</span>
            <span class="comment-timestamp">${formatTime(comment.timestamp)}</span>
        `;
        commentsList.appendChild(commentElement);
    });
}

function submitComment() {
    if (!currentViewingPostId || !loggedInUser) return;

    const content = document.getElementById('new-comment-content').value.trim();
    if (!content) return;

    let allComments = getData(STORAGE_COMMENTS);
    const newComment = {
        id: Date.now(),
        postId: currentViewingPostId,
        username: loggedInUser,
        content: content,
        timestamp: Date.now(),
    };
    
    allComments.push(newComment);
    saveData(STORAGE_COMMENTS, allComments);
    
    updateCommentCount(currentViewingPostId, 1);

    document.getElementById('new-comment-content').value = '';
    
    loadComments(currentViewingPostId);
}

function updateCommentCount(postId, change) {
    let posts = getData(STORAGE_POSTS);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex > -1) {
        posts[postIndex].comments = (posts[postIndex].comments || 0) + change; 
        saveData(STORAGE_POSTS, posts);
        
        loadPosts(); 
    }
}

// --- PROFILE LOGIC ---

function showProfile() {
    loadProfileData();
    profileModal.style.display = 'flex'; 
}

function closeProfileModal() { 
    profileModal.style.display = 'none';
    profileUpdateMsg.textContent = ''; 
}

function showFeed() { 
    closeProfileModal();
    showView('feed-view');
}

function loadProfileData() {
    profileUpdateMsg.textContent = '';
    if (loggedInUser) {
        editUsernameInput.value = loggedInUser;
    }
}

function saveProfileChanges() {
    const newUsername = editUsernameInput.value.trim();
    if (!newUsername || newUsername === loggedInUser) {
        profileUpdateMsg.textContent = 'No changes made.';
        return;
    }

    let users = getData(STORAGE_USERS);
    let posts = getData(STORAGE_POSTS);

    const userIndex = users.findIndex(u => u.username === loggedInUser);
    if (userIndex > -1) {
        if (users.some((u, index) => u.username === newUsername && index !== userIndex)) {
            profileUpdateMsg.textContent = 'Username already taken.';
            return;
        }
        users[userIndex].username = newUsername;
    }

    posts.forEach(post => {
        if (post.username === loggedInUser) {
            post.username = newUsername;
        }
    });

    let comments = getData(STORAGE_COMMENTS);
    comments.forEach(comment => {
        if (comment.username === loggedInUser) {
            comment.username = newUsername;
        }
    });
    saveData(STORAGE_COMMENTS, comments);

    loggedInUser = newUsername;
    localStorage.setItem(STORAGE_LOGGED_IN_USER, newUsername);
    
    saveData(STORAGE_USERS, users);
    saveData(STORAGE_POSTS, posts);
    
    updateHeaderUsername(); 
    
    profileUpdateMsg.textContent = 'Profile updated successfully!';
    
    setTimeout(() => {
        closeProfileModal(); 
        showView('feed-view'); 
    }, 1500);
}