/**
 * Ping App - Main Application Logic
 * Connect with family on Fomilo
 */

const App = (function() {
    'use strict';

    // App State
    const state = {
        isAuthenticated: false,
        currentUser: null,
        posts: [],
        messages: []
    };

    // DOM Elements Cache
    const elements = {};

    /**
     * Initialize the application
     */
    function init() {
        cacheElements();
        initAuth();
        initEventListeners();
        checkAuthState();
        setupDragAndDrop();
        registerServiceWorker();
        setupOnlineOfflineHandlers();
    }

    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements.authScreen = document.getElementById('authScreen');
        elements.mainApp = document.getElementById('mainApp');
        elements.bottomNav = document.getElementById('bottomNav');
        elements.loginForm = document.getElementById('loginForm');
        elements.emailInput = document.getElementById('email');
        elements.passwordInput = document.getElementById('password');
        elements.emailError = document.getElementById('emailError');
        elements.passwordError = document.getElementById('passwordError');
        elements.loginBtn = document.getElementById('loginBtn');
        elements.createAccountBtn = document.getElementById('createAccountBtn');
        elements.createPostModal = document.getElementById('createPostModal');
        elements.uploadArea = document.getElementById('uploadArea');
        elements.fileInput = document.getElementById('fileInput');
        elements.imagePreview = document.getElementById('imagePreview');        elements.captionInput = document.getElementById('captionInput');
        elements.shareBtn = document.getElementById('shareBtn');
        elements.toast = document.getElementById('toast');
        elements.messageBadge = document.getElementById('messageBadge');
    }

    // ==================== AUTHENTICATION ====================

    function initAuth() {
        elements.loginForm?.addEventListener('submit', handleLogin);
        elements.createAccountBtn?.addEventListener('click', handleCreateAccount);
        document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Password reset link sent to your email', 'success');
        });
    }

    function handleLogin(e) {
        e.preventDefault();
        
        // Reset errors
        elements.emailError.style.display = 'none';
        elements.passwordError.style.display = 'none';
        elements.emailInput.classList.remove('input-error');
        elements.passwordInput.classList.remove('input-error');
        
        const email = elements.emailInput.value.trim();
        const password = elements.passwordInput.value;
        let isValid = true;

        // Validate email
        if (!email || !isValidEmail(email)) {
            elements.emailError.style.display = 'block';
            elements.emailInput.classList.add('input-error');
            isValid = false;
        }

        // Validate password
        if (!password || password.length < 6) {
            elements.passwordError.style.display = 'block';
            elements.passwordInput.classList.add('input-error');
            isValid = false;
        }

        if (!isValid) return;

        // Disable button during "login"
        elements.loginBtn.disabled = true;
        elements.loginBtn.innerHTML = '<span>Signing in...</span>';
        // Simulate API call
        setTimeout(() => {
            state.isAuthenticated = true;
            state.currentUser = {
                name: 'John Doe',
                handle: '@johndoe',
                avatar: 'https://i.pravatar.cc/150?img=1'
            };
            
            // Save to localStorage for persistence
            localStorage.setItem('ping_auth', JSON.stringify({
                isAuthenticated: true,
                user: state.currentUser
            }));
            
            // Show main app
            elements.authScreen.style.display = 'none';
            elements.mainApp.style.display = 'flex';
            elements.bottomNav.style.display = 'flex';
            
            showToast('Welcome back, John! 👋', 'success');
            
            // Reset form
            elements.loginForm.reset();
            elements.loginBtn.disabled = false;
            elements.loginBtn.innerHTML = '<span>Sign In</span>';
        }, 1000);
    }

    function handleCreateAccount() {
        showToast('Account creation coming soon! 🎉', 'success');
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function checkAuthState() {
        const savedAuth = localStorage.getItem('ping_auth');
        if (savedAuth) {
            try {
                const auth = JSON.parse(savedAuth);
                if (auth.isAuthenticated) {
                    state.isAuthenticated = true;
                    state.currentUser = auth.user;
                    elements.authScreen.style.display = 'none';
                    elements.mainApp.style.display = 'flex';
                    elements.bottomNav.style.display = 'flex';
                }
            } catch (e) {                console.error('Error parsing auth state:', e);
                localStorage.removeItem('ping_auth');
            }
        }
    }

    // ==================== VIEW MANAGEMENT ====================

    function showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const viewMap = {
            'home': 'homeView',
            'profile': 'profileView',
            'messages': 'messagesView'
        };

        const viewId = viewMap[viewName];
        if (viewId) {
            document.getElementById(viewId)?.classList.add('active');
        }

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });
        
        const navMap = {
            'home': 0,
            'profile': 4,
            'messages': 3
        };
        
        const navIndex = navMap[viewName];
        if (navIndex !== undefined) {
            const navItems = document.querySelectorAll('.nav-item');
            if (navItems[navIndex]) {
                navItems[navIndex].classList.add('active');
                navItems[navIndex].setAttribute('aria-current', 'page');
            }
        }

        // Clear message badge when viewing messages
        if (viewName === 'messages') {
            elements.messageBadge.style.display = 'none';        }
    }

    // ==================== MODAL FUNCTIONS ====================

    function openModal() {
        elements.createPostModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        elements.captionInput.focus();
    }

    function closeModal() {
        elements.createPostModal.classList.remove('active');
        document.body.style.overflow = '';
        resetPostForm();
    }

    function resetPostForm() {
        elements.captionInput.value = '';
        elements.imagePreview.src = '';
        elements.imagePreview.classList.remove('visible');
        elements.uploadArea.classList.remove('has-image');
        elements.fileInput.value = '';
        const uploadText = elements.uploadArea.querySelector('p');
        if (uploadText) uploadText.style.display = 'block';
    }

    // ==================== FILE HANDLING ====================

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast('Image too large. Max 10MB allowed', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                elements.imagePreview.src = e.target.result;
                elements.imagePreview.classList.add('visible');
                elements.uploadArea.classList.add('has-image');
                const uploadText = elements.uploadArea.querySelector('p');
                if (uploadText) uploadText.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else if (file) {
            showToast('Please select an image file', 'error');
        }    }

    // ==================== DRAG AND DROP ====================

    function setupDragAndDrop() {
        const uploadArea = elements.uploadArea;
        if (!uploadArea) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        uploadArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files[0]) {
                elements.fileInput.files = files;
                handleFileSelect({ target: elements.fileInput });
            }
        }

        // Click to upload
        uploadArea.addEventListener('click', () => {
            elements.fileInput.click();
        });

        // Keyboard support
        uploadArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();                elements.fileInput.click();
            }
        });
    }

    // ==================== POST CREATION ====================

    function createPost() {
        const caption = elements.captionInput.value.trim();
        const hasImage = elements.imagePreview.src && elements.imagePreview.classList.contains('visible');
        
        if (!caption && !hasImage) {
            showToast('Please add a caption or photo', 'error');
            return;
        }

        // Disable button during posting
        elements.shareBtn.disabled = true;
        elements.shareBtn.innerHTML = '<span>Posting...</span>';

        // Simulate API call
        setTimeout(() => {
            // Add new post to feed
            addPostToFeed(caption, elements.imagePreview.src);
            
            showToast('Post shared successfully! 🎉', 'success');
            closeModal();
            
            // Reset button
            elements.shareBtn.disabled = false;
            elements.shareBtn.innerHTML = '<span>Share</span>';
        }, 800);
    }

    function addPostToFeed(caption, imageUrl) {
        const feed = document.querySelector('.feed');
        if (!feed) return;
        
        const newPost = document.createElement('article');
        newPost.className = 'post fade-in';
        newPost.setAttribute('aria-label', 'Your new post');
        
        const timeAgo = 'Just now';
        const avatarUrl = state.currentUser?.avatar || 'https://i.pravatar.cc/150?img=1';
        const userName = state.currentUser?.name || 'You';
        
        newPost.innerHTML = `
            <div class="post-header">
                <img src="${avatarUrl}" alt="${userName}" class="post-avatar">
                <div class="post-info">                    <div class="post-author">${escapeHtml(userName)}</div>
                    <div class="post-time">${timeAgo}</div>
                </div>
                <button class="post-menu" aria-label="More options">⋯</button>
            </div>
            <div class="post-content">
                <p class="post-text">${escapeHtml(caption)}</p>
                ${imageUrl ? `<img src="${imageUrl}" alt="Post image" class="post-image">` : ''}
            </div>
            <div class="post-actions" role="group" aria-label="Post actions">
                <button class="action-btn" onclick="App.toggleLike(this)" aria-pressed="false" aria-label="Like post">
                    <span aria-hidden="true">❤️</span>
                    <span class="like-count">0</span>
                </button>
                <button class="action-btn" aria-label="Comment on post">
                    <span aria-hidden="true">💬</span>
                    <span>0</span>
                </button>
                <button class="action-btn" aria-label="Share post">
                    <span aria-hidden="true">↗️</span>
                    <span>Share</span>
                </button>
            </div>
        `;
        
        // Insert at top of feed
        feed.insertBefore(newPost, feed.firstChild);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== LIKE FUNCTIONALITY ====================

    function toggleLike(btn) {
        const isLiked = btn.classList.toggle('liked');
        btn.setAttribute('aria-pressed', isLiked);
        
        const countSpan = btn.querySelector('.like-count');
        let count = parseInt(countSpan?.textContent) || 0;
        
        if (isLiked) {
            countSpan.textContent = count + 1;
        } else {
            countSpan.textContent = Math.max(0, count - 1);
        }
    }
    // ==================== TOAST NOTIFICATIONS ====================

    function showToast(message, type = 'info') {
        const toast = elements.toast;
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type, 'show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==================== EVENT LISTENERS ====================

    function initEventListeners() {
        // Close modal on outside click
        elements.createPostModal?.addEventListener('click', (e) => {
            if (e.target === elements.createPostModal) {
                closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.createPostModal?.classList.contains('active')) {
                closeModal();
            }
        });

        // Bottom nav items
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            item.addEventListener('click', function() {
                const actions = ['home', 'search', null, 'messages', 'profile'];
                const action = actions[index];
                if (action) {
                    showView(action);
                }
            });
        });

        // Story items
        document.querySelectorAll('.story').forEach(story => {
            story.addEventListener('click', function() {
                const nameEl = this.querySelector('.story-name');
                const name = nameEl?.textContent || '';
                if (name === 'Your Story') {                    openModal();
                } else {
                    showToast(`Viewing ${name}'s story`, 'success');
                }
            });
        });

        // Message items
        document.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', function() {
                const nameEl = this.querySelector('.message-name');
                const name = nameEl?.textContent || '';
                showToast(`Opening chat with ${name}`, 'success');
                // Remove unread indicator
                this.classList.remove('unread');
                updateMessageBadge();
            });
        });

        // Search button (placeholder)
        const searchBtn = document.querySelector('.nav-item:nth-child(2)');
        searchBtn?.addEventListener('click', () => {
            showToast('Search feature coming soon! 🔍', 'success');
        });
    }

    // ==================== MESSAGE BADGE ====================

    function updateMessageBadge() {
        const unreadCount = document.querySelectorAll('.message-item.unread').length;
        if (unreadCount > 0) {
            elements.messageBadge.textContent = unreadCount;
            elements.messageBadge.style.display = 'block';
        } else {
            elements.messageBadge.style.display = 'none';
        }
    }

    // ==================== SERVICE WORKER ====================

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('SW registered:', registration.scope);
                    })
                    .catch(error => {
                        console.log('SW registration failed:', error);
                    });            });
        }
    }

    // ==================== ONLINE/OFFLINE HANDLERS ====================

    function setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => showToast('You\'re back online! 🌐', 'success'));
        window.addEventListener('offline', () => showToast('You\'re offline. Some features limited', 'error'));
    }

    // ==================== PUBLIC API ====================

    return {
        init,
        showView,
        openModal,
        closeModal,
        handleFileSelect,
        createPost,
        toggleLike,
        showToast
    };

})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
