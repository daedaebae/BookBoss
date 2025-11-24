// State Variables
// Tracks the current application state including books, user session, and UI filters
let books = [];
let html5QrcodeScanner = null;
let currentFilter = 'all';
let searchQuery = '';
let currentUser = null;
let authToken = null;

// DOM Elements
const bookGrid = document.getElementById('book-grid');
const toast = document.getElementById('toast');
const sidebarNav = document.querySelector('.sidebar-nav');
const loginLogoutBtn = document.getElementById('login-logout-btn');

// Modal Elements
const addBookBtn = document.getElementById('add-book-btn');
const addBookModal = document.getElementById('add-book-modal');
const closeModalBtn = document.querySelector('.close-modal-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Login Modal Elements
const loginModal = document.getElementById('login-modal');
const closeLoginModalBtn = document.querySelector('.close-login-modal');
const loginForm = document.getElementById('login-form');

// Edit Modal Elements
const editBookModal = document.getElementById('edit-book-modal');
const closeEditModalBtn = document.querySelector('.close-edit-modal');
const editBookForm = document.getElementById('edit-book-form');

// Reader Elements
const readerModal = document.getElementById('reader-modal');
const readerCloseBtn = document.getElementById('reader-close');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
let bookRendition = null;

// Form Elements
const manualEntryForm = document.getElementById('manual-entry-form');

// Header Search
const headerSearchInput = document.getElementById('api-search-input');

// Online Search (Modal)
const onlineSearchInput = document.getElementById('online-search-input');
const onlineSearchBtn = document.getElementById('online-search-btn');
const onlineSearchResults = document.getElementById('search-results');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check for session
    const storedUser = localStorage.getItem('bookboss_user');
    const storedToken = localStorage.getItem('bookboss_token');

    if (storedUser && storedToken) {
        currentUser = JSON.parse(storedUser);
        authToken = storedToken;
        document.getElementById('login-overlay').classList.add('hidden');
        loadBooks();
        updateAuthUI();
    } else {
        // Show login overlay (it's visible by default in HTML, but ensure it)
        document.getElementById('login-overlay').classList.remove('hidden');
    }

    setupEventListeners();
    setupSettings();

    // Apply saved theme
    const savedTheme = localStorage.getItem('bookboss_theme') || 'dark';
    const savedAccent = localStorage.getItem('bookboss_accent');
    applyTheme(savedTheme, savedAccent);
});

/**
 * Sets up all global event listeners for the application
 * Includes modal handling, navigation, search, and form submissions
 */
function setupEventListeners() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    if (mobileMenuToggle && sidebar && sidebarOverlay) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });

        // Close sidebar when clicking a nav item on mobile
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                }
            });
        });
    }

    // Modal Handling
    if (addBookBtn) {
        addBookBtn.addEventListener('click', openModal);
    }
    closeModalBtn.addEventListener('click', closeModal);
    addBookModal.addEventListener('click', (e) => {
        if (e.target === addBookModal) closeModal();
    });

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate clicked
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');

            // Handle Scanner
            if (btn.dataset.tab === 'scan') {
                startScanner();
            } else {
                stopScanner();
            }
        });
    });

    // Manual Entry
    manualEntryForm.addEventListener('submit', handleManualSubmit);

    // API Search (Online)
    if (onlineSearchBtn) {
        onlineSearchBtn.addEventListener('click', handleApiSearch);
    }
    if (onlineSearchInput) {
        onlineSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleApiSearch();
        });
    }

    // Header Search (Local)
    if (headerSearchInput) {
        headerSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderLibrary();
        });
    }

    // Edit Modal
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => editBookModal.classList.add('hidden'));
    }
    if (editBookForm) {
        editBookForm.addEventListener('submit', handleEditSubmit);
    }

    // Reader Controls
    if (readerCloseBtn) {
        readerCloseBtn.addEventListener('click', () => {
            readerModal.classList.add('hidden');
            if (bookRendition) {
                bookRendition.destroy();
                bookRendition = null;
            }
        });
    }
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => bookRendition && bookRendition.prev());
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => bookRendition && bookRendition.next());

    // Sidebar Navigation
    sidebarNav.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-item');
        if (!link || !link.dataset.filter) return;

        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        link.classList.add('active');

        currentFilter = link.dataset.filter;
        renderLibrary();
    });

    // Login/Logout
    loginLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            handleLogout();
        } else {
            // Should not happen if overlay is working, but fallback
            document.getElementById('login-overlay').classList.remove('hidden');
        }
    });

    if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Registration Toggle
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const registerForm = document.getElementById('register-form');

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Global Click to close Context Menus
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.book-card')) {
            document.querySelectorAll('.book-card.active').forEach(card => card.classList.remove('active'));
        }
    });

    updateAuthUI();
}

/**
 * Wrapper for fetch that adds the Authorization header
 * Handles 401/403 responses by logging out the user
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
async function authenticatedFetch(url, options = {}) {
    const headers = options.headers || {};
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const newOptions = { ...options, headers };

    const response = await fetch(url, newOptions);

    if (response.status === 401 || response.status === 403) {
        handleLogout();
        showToast('Session expired. Please login again.', 'error');
        throw new Error('Unauthorized');
    }

    return response;
}

/**
 * Handles the login form submission
 * Authenticates with the server and stores the session token
 * @param {Event} e - The submit event
 */
async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Success
        currentUser = {
            id: data.id,
            username: data.username,
            isAdmin: data.isAdmin
        };
        authToken = data.token;

        localStorage.setItem('bookboss_user', JSON.stringify(currentUser));
        localStorage.setItem('bookboss_token', authToken);

        document.getElementById('login-overlay').classList.add('hidden');
        usernameInput.value = '';
        passwordInput.value = '';

        loadBooks();
        updateAuthUI();
        showToast(`Welcome back, ${currentUser.username}!`);

    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}


async function handleRegister(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('reg-username');
    const passwordInput = document.getElementById('reg-password');
    const confirmPasswordInput = document.getElementById('reg-confirm-password');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!username || !password) {
        showToast('Username and password required', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        // Reuse create user API but as public registration (might need server adjustment if auth required)
        // Actually, /api/users requires auth. We need a public registration endpoint or allow non-auth for this specific case.
        // For now, let's assume we need to login as admin to create users, OR we modify server to allow public registration.
        // The plan said "Toggle between Login and Register forms", implying public registration.
        // Let's try to hit /api/users without auth? No, it's protected.
        // We need to add a public registration endpoint to server.js or modify /api/users.
        // Let's add a specific public registration endpoint /api/register in server.js later.
        // For now, I'll implement the client side call to /api/register.

        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        showToast('Registration successful! Please login.');
        document.getElementById('show-login-btn').click();
        usernameInput.value = '';
        passwordInput.value = '';
        confirmPasswordInput.value = '';

    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

function handleLogout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('bookboss_user');
    localStorage.removeItem('bookboss_token');

    document.getElementById('login-overlay').classList.remove('hidden');
    books = [];
    renderLibrary();
    updateAuthUI();
    showToast('Logged out successfully');
}

// Data Management

/**
 * Fetches all books from the server and updates the local state
 * Applies default sorting and triggers a re-render
 */
async function loadBooks() {
    try {
        const response = await authenticatedFetch('http://localhost:3000/api/books');
        if (!response.ok) throw new Error('Failed to load books');
        books = await response.json();

        // Apply Default Sort
        const sortPref = localStorage.getItem('bookboss_sort') || 'added_desc';
        sortBooks(sortPref);

        renderLibrary();
    } catch (err) {
        console.error(err);
        showToast('Failed to load library', 'error');
    }
}

// saveBooks and migrateData removed as we use a database now

async function addBook(bookData) {
    // Check for duplicates (only if bookData is object, harder with FormData)
    // Skipping client-side duplicate check for FormData for now or need to parse it.

    const isFormData = bookData instanceof FormData;

    try {
        const options = {
            method: 'POST',
        };

        if (isFormData) {
            options.body = bookData;
            // Do NOT set Content-Type header, browser sets it with boundary
            // But we need to add Auth header manually since we can't use the simple headers object in authenticatedFetch if we pass it directly
            // Actually authenticatedFetch handles merging headers.
        } else {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(bookData);
        }

        const response = await authenticatedFetch('http://localhost:3000/api/books', options);

        if (!response.ok) throw new Error('Failed to add book');

        // Reload to get ID and fresh state
        await loadBooks();
        showToast(`Book added successfully!`);
        closeModal();
    } catch (err) {
        console.error(err);
        showToast('Failed to save book', 'error');
    }
}

async function removeBook(idOrIsbn) {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
        const response = await authenticatedFetch(`http://localhost:3000/api/books/${idOrIsbn}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete book');

        await loadBooks();
        showToast('Book removed.');
    } catch (err) {
        console.error(err);
        showToast('Failed to delete book', 'error');
    }
}

// UI Rendering

/**
 * Renders the book grid based on current state and filters
 * Handles "Hot", "Downloaded", "Read" filters and search queries
 */
function renderLibrary() {
    bookGrid.innerHTML = '';

    let filtered = books;
    if (currentFilter === 'hot') {
        // Dummy logic for "Hot"
        filtered = books.slice(0, 5);
    } else if (currentFilter === 'downloaded') {
        filtered = books.filter(b => b.file_path);
    } else if (currentFilter === 'read') {
        // Dummy logic for "Read"
        filtered = [];
    }

    // Apply Search Filter
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q)
        );
    }

    filtered.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.title = book.title; // For tooltip

        // Use uploaded cover path if available (prefixed with server URL), else external URL
        let coverUrl = book.cover_url || 'https://via.placeholder.com/128x192?text=No+Cover';
        if (book.cover_image_path) {
            coverUrl = `http://localhost:3000/${book.cover_image_path}`;
        }

        // Context Menu Items
        let menuItems = '';

        if (book.file_path) {
            if (book.format === 'EPUB') {
                menuItems += `<button class="context-btn" onclick="openReader('${book.id}', '${book.title}')">📖 Read</button>`;
            }
            menuItems += `<a href="http://localhost:3000/api/books/${book.id}/download" class="context-btn" target="_blank">⬇ Download</a>`;
        }

        // Admin only actions (Edit/Delete)
        if (currentUser && currentUser.isAdmin) {
            menuItems += `<button class="context-btn" onclick="openEditModal(${book.id})">✎ Edit</button>`;
            menuItems += `<button class="context-btn" onclick="removeBook('${book.id || book.isbn}')">🗑 Delete</button>`;
        }

        card.innerHTML = `
            <img src="${coverUrl}" alt="${book.title}" class="book-cover" loading="lazy">
            <div class="context-menu">
                ${menuItems || '<div style="padding:10px; color:#888;">No actions</div>'}
            </div>
        `;

        // Toggle Menu on Click
        card.addEventListener('click', (e) => {
            // Close others
            document.querySelectorAll('.book-card.active').forEach(c => {
                if (c !== card) c.classList.remove('active');
            });
            card.classList.toggle('active');
            e.stopPropagation();
        });

        bookGrid.appendChild(card);
    });
}

// Modal Logic

/**
 * Opens the Add Book modal and resets to default state
 */
function openModal() {
    addBookModal.classList.remove('hidden');
    // Default to Scan tab
    tabBtns[0].click();
}

function closeModal() {
    addBookModal.classList.add('hidden');
    stopScanner();
    manualEntryForm.reset();
    onlineSearchResults.innerHTML = '';
    onlineSearchInput.value = '';
}

// Manual Entry

/**
 * Handles the manual book entry form submission
 * Processes form data including categories and descriptors
 * @param {Event} e - Submit event
 */
function handleManualSubmit(e) {
    e.preventDefault();
    const formData = new FormData(manualEntryForm);

    // Handle Categories (comma separated -> JSON array)
    const categoriesInput = manualEntryForm.querySelector('input[name="categories"]');
    if (categoriesInput && categoriesInput.value.trim()) {
        const categories = categoriesInput.value.split(',').map(c => c.trim()).filter(c => c);
        formData.set('categories', JSON.stringify(categories));
    } else {
        formData.set('categories', JSON.stringify([]));
    }

    // Handle Descriptors (comma separated -> JSON)
    const descriptorsInput = manualEntryForm.querySelector('input[name="descriptors"]');
    if (descriptorsInput && descriptorsInput.value.trim()) {
        const descriptors = descriptorsInput.value.split(',').map(d => d.trim()).filter(d => d);
        formData.set('descriptors', JSON.stringify(descriptors));
    } else {
        formData.set('descriptors', JSON.stringify([]));
    }

    // Ensure other fields are present (FormData captures them automatically from name attributes)
    // binding_type, format, coverFile, cover, library, isbn, author, title are all in the form now.

    if (!formData.get('addedAt')) {
        formData.append('addedAt', new Date().toISOString());
    }

    addBook(formData);
}

// API Search Logic

/**
 * Searches OpenLibrary API for books matching the query
 * Displays results with "Add" buttons
 */
async function handleApiSearch() {
    const query = onlineSearchInput.value.trim();
    if (!query) return;

    onlineSearchBtn.textContent = 'Searching...';
    onlineSearchBtn.disabled = true;
    onlineSearchResults.innerHTML = '';

    try {
        // Search Open Library
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.docs && data.docs.length > 0) {
            onlineSearchResults.innerHTML = `<div style="margin-bottom: 15px; color: var(--text-secondary); font-size: 0.9rem;">Found ${data.numFound.toLocaleString()} results (showing ${data.docs.length})</div>`;

            data.docs.forEach(doc => {
                const item = document.createElement('div');
                item.className = 'api-result-item';

                const coverId = doc.cover_i;
                const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : 'https://via.placeholder.com/80x120?text=No+Cover';
                const publishYear = doc.first_publish_year || 'Unknown';
                const publisher = doc.publisher ? doc.publisher[0] : '';
                const isbn = doc.isbn ? doc.isbn[0] : '';
                const subjects = doc.subject ? doc.subject.slice(0, 3).join(', ') : '';

                item.innerHTML = `
                    <img src="${coverUrl}" class="api-result-thumb" style="width: 60px; height: 90px; object-fit: cover; border-radius: 4px;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px;">${doc.title}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 2px;">
                            <strong>Author:</strong> ${doc.author_name ? doc.author_name.join(', ') : 'Unknown'}
                        </div>
                        ${publishYear !== 'Unknown' ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 2px;">
                            <strong>Published:</strong> ${publishYear}${publisher ? ` by ${publisher}` : ''}
                        </div>` : ''}
                        ${isbn ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 2px;">
                            <strong>ISBN:</strong> ${isbn}
                        </div>` : ''}
                        ${subjects ? `<div style="font-size: 0.75rem; color: var(--accent-color); margin-top: 4px;">
                            ${subjects}
                        </div>` : ''}
                    </div>
                    <button class="secondary-btn small" style="margin-left: 10px; white-space: nowrap;">+ Add</button>
                `;

                // Add click handler to the button
                const addBtn = item.querySelector('button');
                addBtn.onclick = (e) => {
                    e.stopPropagation();
                    // Add this book
                    const book = {
                        title: doc.title,
                        author: doc.author_name ? doc.author_name.join(', ') : 'Unknown',
                        isbn: isbn,
                        cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
                        categories: doc.subject ? doc.subject.slice(0, 5) : [],
                        library: 'Main Library',
                        format: 'Physical',
                        binding_type: 'Paperback',
                        descriptors: [],
                        addedAt: new Date().toISOString()
                    };
                    addBook(book);
                };

                onlineSearchResults.appendChild(item);
            });
        } else {
            onlineSearchResults.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding: 20px;">No results found. Try a different search term.</p>';
        }

    } catch (err) {
        console.error(err);
        showToast('Search failed', 'error');
        onlineSearchResults.innerHTML = '<p style="color:var(--danger-color); text-align:center; padding: 20px;">Search failed. Please try again.</p>';
    } finally {
        onlineSearchBtn.textContent = 'Search';
        onlineSearchBtn.disabled = false;
    }
}

// Scanner Logic (Adapted for Modal)

/**
 * Initializes and starts the HTML5 QR Code Scanner
 * Scans for ISBN barcodes
 */
function startScanner() {
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode("reader");
    }

    // Check if already scanning
    if (html5QrcodeScanner.isScanning) return;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("Error starting scanner", err);
        document.getElementById('reader').innerHTML = '<p style="color:red; text-align:center; padding:20px;">Camera access denied or not available.</p>';
    });
}

function stopScanner() {
    if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        html5QrcodeScanner.stop().catch(err => console.error("Failed to stop scanner", err));
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    html5QrcodeScanner.pause();
    showToast('Barcode detected!');

    // Reuse fetch logic but adapted
    try {
        const cleanIsbn = decodedText.replace(/-/g, '').trim();
        const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&jscmd=data&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        const key = `ISBN:${cleanIsbn}`;

        if (data[key]) {
            const info = data[key];
            const book = {
                isbn: cleanIsbn,
                title: info.title || 'Unknown Title',
                author: info.authors ? info.authors.map(a => a.name).join(', ') : 'Unknown Author',
                cover: info.cover ? info.cover.medium : null,
                categories: info.subjects ? info.subjects.map(s => s.name).slice(0, 3) : [],
                library: 'Main Library',
                addedAt: new Date().toISOString()
            };
            addBook(book);
        } else {
            showToast('Book not found in database.', 'error');
            html5QrcodeScanner.resume();
        }
    } catch (err) {
        console.error(err);
        showToast('Error fetching book details.', 'error');
        html5QrcodeScanner.resume();
    }
}

function onScanFailure(error) {
    // ignore
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.style.borderColor = type === 'error' ? 'var(--danger-color)' : 'var(--glass-border)';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

window.removeBook = removeBook;
window.openReader = openReader;
window.openEditModal = openEditModal;

// --- Reader Logic ---

/**
 * Opens the ePub reader for a specific book
 * @param {string} id - Book ID
 * @param {string} title - Book Title
 */
async function openReader(id, title) {
    // Get file path logic - for now assume standard path
    // We need to fetch the book details or construct URL
    const url = `http://localhost:3000/api/books/${id}/download`;

    document.getElementById('reader-title').textContent = title;
    readerModal.classList.remove('hidden');

    const book = ePub(url);
    bookRendition = book.renderTo("epub-viewer", {
        width: "100%",
        height: "100%",
        flow: "paginated"
    });

    bookRendition.display();
}

// --- Edit Logic ---

/**
 * Opens the Edit Book modal and populates it with existing data
 * @param {number} id - Book ID
 */
function openEditModal(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('edit-title').value = book.title;
    document.getElementById('edit-author').value = book.author;
    document.getElementById('edit-isbn').value = book.isbn || '';
    document.getElementById('edit-categories').value = Array.isArray(book.categories) ? book.categories.join(', ') : '';
    document.getElementById('edit-library').value = book.library || 'Main Library';
    document.getElementById('edit-format').value = book.format || 'Physical';
    document.getElementById('edit-book-binding').value = book.binding_type || 'Paperback';
    document.getElementById('edit-book-descriptors').value = Array.isArray(book.descriptors) ? book.descriptors.join(', ') : '';
    document.getElementById('edit-book-cover-url').value = book.cover_url || '';

    editBookModal.classList.remove('hidden');
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-book-id').value;
    const title = document.getElementById('edit-title').value;
    const author = document.getElementById('edit-author').value;
    const isbn = document.getElementById('edit-isbn').value;
    const library = document.getElementById('edit-library').value;
    const categoriesStr = document.getElementById('edit-categories').value;
    const format = document.getElementById('edit-format').value;
    const binding_type = document.getElementById('edit-book-binding').value;
    const descriptorsStr = document.getElementById('edit-book-descriptors').value;
    const coverUrl = document.getElementById('edit-book-cover-url').value;
    const coverFileInput = document.getElementById('edit-book-cover-file');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('isbn', isbn);
    formData.append('library', library);
    formData.append('format', format);
    formData.append('binding_type', binding_type);

    const categories = categoriesStr.split(',').map(c => c.trim()).filter(c => c);
    formData.append('categories', JSON.stringify(categories));

    const descriptors = descriptorsStr.split(',').map(d => d.trim()).filter(d => d);
    formData.append('descriptors', JSON.stringify(descriptors));

    if (coverUrl) formData.append('cover', coverUrl);
    if (coverFileInput && coverFileInput.files[0]) {
        formData.append('coverFile', coverFileInput.files[0]);
    }

    try {
        const response = await authenticatedFetch(`http://localhost:3000/api/books/${id}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to update book');

        showToast('Book updated successfully!');
        editBookModal.classList.add('hidden');
        loadBooks();
    } catch (err) {
        console.error(err);
        showToast('Failed to update book', 'error');
    }
}

// --- Settings & User Management Logic ---

// Settings Functions

/**
 * Fetches and applies application settings (theme, registration)
 */
async function fetchSettings() {
    // Re-query elements here to be safe or pass them in
    const settingDarkMode = document.getElementById('setting-dark-mode');
    const settingAccentColor = document.getElementById('setting-accent-color');
    const settingAllowRegistration = document.getElementById('setting-allow-registration');

    try {
        const response = await authenticatedFetch('http://localhost:3000/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const settings = await response.json();

        // Apply to Form
        if (settingDarkMode) {
            // Default to dark if not set, or if set to 'dark'
            settingDarkMode.checked = (settings.theme !== 'light');
        }
        if (settingAccentColor && settings.accent_color) {
            settingAccentColor.value = settings.accent_color;
        }
        if (settingAllowRegistration && settings.allow_registration) {
            settingAllowRegistration.checked = settings.allow_registration === 'true';
        }

        // Apply Theme Immediately (in case it was changed elsewhere)
        applyTheme(settings.theme || 'dark', settings.accent_color);

        // Show/Hide Register Link based on setting
        const registerLinkContainer = document.getElementById('register-link-container');
        if (registerLinkContainer) {
            if (settings.allow_registration === 'true') {
                registerLinkContainer.classList.remove('hidden');
            } else {
                registerLinkContainer.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to load settings', 'error');
    }
}

async function saveSettings() {
    const settingDarkMode = document.getElementById('setting-dark-mode');
    const settingAccentColor = document.getElementById('setting-accent-color');
    const settingAllowRegistration = document.getElementById('setting-allow-registration');

    const theme = settingDarkMode.checked ? 'dark' : 'light';
    const accentColor = settingAccentColor.value;

    const settings = {
        theme: theme,
        accent_color: accentColor,
        allow_registration: settingAllowRegistration.checked.toString()
    };

    try {
        const response = await authenticatedFetch('http://localhost:3000/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        if (!response.ok) throw new Error('Failed to save settings');

        showToast('Settings saved successfully!');

        // Apply changes immediately
        applyTheme(settings.theme, settings.accent_color);
        localStorage.setItem('bookboss_theme', settings.theme);
        localStorage.setItem('bookboss_accent', settings.accent_color);

        const registerLinkContainer = document.getElementById('register-link-container');
        if (registerLinkContainer) {
            if (settings.allow_registration === 'true') {
                registerLinkContainer.classList.remove('hidden');
            } else {
                registerLinkContainer.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to save settings', 'error');
    }
}

// User Functions

/**
 * Fetches and displays the list of users (Admin only)
 */
async function fetchUsers() {
    const usersList = document.getElementById('user-list');
    try {
        const response = await authenticatedFetch('http://localhost:3000/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const users = await response.json();
        renderUsers(users, usersList);
    } catch (err) {
        console.error(err);
        showToast('Failed to load users', 'error');
    }
}

function renderUsers(users, usersList) {
    if (!usersList) return;
    usersList.innerHTML = '';
    users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = `
            <div class="user-info">
                <span style="font-weight:500">${user.username}</span>
                ${user.is_admin ? '<span class="admin-badge">Admin</span>' : ''}
            </div>
            <button class="delete-user-btn" onclick="deleteUser(${user.id})" title="Delete User">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
        usersList.appendChild(div);
    });
}

async function createUser() {
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');
    const newIsAdminInput = document.getElementById('new-is-admin');
    const cancelUserBtn = document.getElementById('cancel-user-btn');

    const username = newUsernameInput.value.trim();
    const password = newPasswordInput.value.trim();
    const isAdmin = newIsAdminInput.checked;

    if (!username || !password) {
        showToast('Username and password required', 'error');
        return;
    }

    try {
        const response = await authenticatedFetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, isAdmin })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create user');
        }

        showToast('User created successfully!');
        cancelUserBtn.click(); // Reset form
        fetchUsers(); // Reload list
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await authenticatedFetch(`http://localhost:3000/api/users/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete user');

        showToast('User deleted successfully');
        fetchUsers();
    } catch (err) {
        console.error(err);
        showToast('Failed to delete user', 'error');
    }
}

// Expose deleteUser to window for onclick
window.deleteUser = deleteUser;

function setupSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsCloseBtn = settingsModal.querySelector('.close-modal-btn'); // Fixed selector
    const settingsTabBtns = settingsModal.querySelectorAll('.settings-tab-btn');
    const settingsTabContents = settingsModal.querySelectorAll('.tab-content');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // User Management Elements
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserForm = document.getElementById('add-user-form-container');
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    const saveUserBtn = document.getElementById('save-user-btn');
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');
    const newIsAdminInput = document.getElementById('new-is-admin');

    // New Settings Elements
    const changePasswordForm = document.getElementById('change-password-form');
    const saveFiltersBtn = document.getElementById('save-filters-btn');
    const defaultSortSelect = document.getElementById('setting-default-sort');

    // Load Filter Prefs
    if (defaultSortSelect) {
        defaultSortSelect.value = localStorage.getItem('bookboss_sort') || 'added_desc';
    }

    // Settings Event Listeners
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');

            // Handle admin-only tab visibility
            const adminOnlyTabs = settingsModal.querySelectorAll('.admin-only');
            if (currentUser && currentUser.isAdmin) {
                // Show all tabs for admin
                adminOnlyTabs.forEach(tab => tab.classList.remove('hidden'));
            } else {
                // Hide admin-only tabs for standard users
                adminOnlyTabs.forEach(tab => tab.classList.add('hidden'));

                // If the currently active tab is admin-only, switch to first non-admin tab
                const activeTab = settingsModal.querySelector('.settings-tab-btn.active');
                if (activeTab && activeTab.classList.contains('admin-only')) {
                    // Deactivate current
                    activeTab.classList.remove('active');
                    settingsTabContents.forEach(c => c.classList.remove('active'));

                    // Activate first non-admin tab (Profile)
                    const firstNonAdminTab = settingsModal.querySelector('.settings-tab-btn:not(.admin-only)');
                    if (firstNonAdminTab) {
                        firstNonAdminTab.classList.add('active');
                        const tabId = firstNonAdminTab.dataset.tab;
                        document.getElementById(`${tabId}-tab`).classList.add('active');
                    }
                }
            }

            fetchSettings();
            fetchUsers();
        });
    }

    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });
    }

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });


    settingsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            settingsTabBtns.forEach(b => b.classList.remove('active'));
            settingsTabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });

    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);

    // User Management Event Listeners
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            addUserForm.classList.add('active');
            newUsernameInput.focus();
        });
    }

    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', () => {
            addUserForm.classList.remove('active');
            newUsernameInput.value = '';
            newPasswordInput.value = '';
            newIsAdminInput.checked = false;
        });
    }

    if (saveUserBtn) saveUserBtn.addEventListener('click', createUser);

    // Profile: Change Password
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('profile-new-password').value;
            const confirmPass = document.getElementById('profile-confirm-password').value;

            if (newPass !== confirmPass) {
                showToast('Passwords do not match', 'error');
                return;
            }

            if (!currentUser) return;

            try {
                const response = await fetch(`http://localhost:3000/api/users/${currentUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPass })
                });

                if (!response.ok) throw new Error('Failed to update password');
                showToast('Password updated successfully');
                changePasswordForm.reset();
            } catch (err) {
                console.error(err);
                showToast('Failed to update password', 'error');
            }
        });
    }

    // Filters: Save
    if (saveFiltersBtn) {
        saveFiltersBtn.addEventListener('click', () => {
            const sort = defaultSortSelect.value;
            localStorage.setItem('bookboss_sort', sort);
            sortBooks(sort);
            renderLibrary();
            showToast('Preferences saved');
        });
    }

    // Export: Handle export button
    const exportLibraryBtn = document.getElementById('export-library-btn');
    const exportFormatSelect = document.getElementById('export-format-select');
    if (exportLibraryBtn && exportFormatSelect) {
        exportLibraryBtn.addEventListener('click', () => {
            const format = exportFormatSelect.value;
            exportLibrary(format);
        });
    }

    // Metadata Refresh: Handle refresh all button
    const refreshAllMetadataBtn = document.getElementById('refresh-all-metadata-btn');
    const refreshProgress = document.getElementById('refresh-progress');
    const refreshStatus = document.getElementById('refresh-status');
    const refreshProgressBar = document.getElementById('refresh-progress-bar');
    const refreshBtnText = document.getElementById('refresh-btn-text');

    if (refreshAllMetadataBtn) {
        refreshAllMetadataBtn.addEventListener('click', async () => {
            if (!confirm('This will refresh metadata and download cover images for all books. This may take a while. Continue?')) {
                return;
            }

            refreshAllMetadataBtn.disabled = true;
            refreshBtnText.textContent = '⏳ Processing...';
            refreshProgress.classList.remove('hidden');
            refreshProgressBar.style.width = '10%';
            refreshStatus.textContent = 'Starting metadata refresh...';

            try {
                const response = await authenticatedFetch('http://localhost:3000/api/books/refresh-metadata', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || `Server returned ${response.status}`);
                }

                const result = await response.json();

                refreshProgressBar.style.width = '100%';
                refreshStatus.textContent = result.message || 'Completed!';
                showToast(`Metadata refresh completed! Processed ${result.processed} books.`);
                loadBooks(); // Reload books to show updated covers
            } catch (err) {
                console.error('Metadata refresh error:', err);
                showToast(`Failed to refresh metadata: ${err.message}`, 'error');
                refreshStatus.textContent = `Error: ${err.message}`;
            } finally {
                refreshAllMetadataBtn.disabled = false;
                refreshBtnText.textContent = '🔄 Refresh All Metadata';
                setTimeout(() => {
                    refreshProgress.classList.add('hidden');
                }, 3000);
            }
        });
    }
}

// Initial Fetch
fetchSettings();

// Auth UI Update
function updateAuthUI() {
    if (currentUser) {
        // Logged In
        loginLogoutBtn.innerHTML = `<span class="icon">👤</span> Logout (${currentUser.username})`;

        // Show Admin Elements
        if (currentUser.isAdmin) {
            if (addBookBtn) addBookBtn.classList.remove('hidden');
            // Settings button is always visible but maybe restricted?
            // For now, let's keep it simple.
        }
    } else {
        // Logged Out
        loginLogoutBtn.innerHTML = `<span class="icon">👤</span> Login`;

        // Hide Admin Elements
        if (addBookBtn) addBookBtn.classList.add('hidden');
    }
}

// Helper: Sort Books
function sortBooks(criteria) {
    if (criteria === 'added_desc') {
        books.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
    } else if (criteria === 'added_asc') {
        books.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
    } else if (criteria === 'title_asc') {
        books.sort((a, b) => a.title.localeCompare(b.title));
    } else if (criteria === 'author_asc') {
        books.sort((a, b) => a.author.localeCompare(b.author));
    }
}

// Export Function
function exportLibrary(format) {
    if (!books || books.length === 0) {
        showToast('No books to export', 'error');
        return;
    }

    let content = '';
    let mimeType = '';
    let filename = `library_export_${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
        content = JSON.stringify(books, null, 2);
        mimeType = 'application/json';
        filename += '.json';
    } else if (format === 'csv') {
        const headers = ['Title', 'Author', 'ISBN', 'Library', 'Added At'];
        const rows = books.map(b => [
            `"${b.title.replace(/"/g, '""')}"`,
            `"${b.author.replace(/"/g, '""')}"`,
            `"${b.isbn || ''}"`,
            `"${b.library || ''}"`,
            `"${b.added_at}"`
        ]);
        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        mimeType = 'text/csv';
        filename += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Library exported as ${format.toUpperCase()}`);
}

// Helper: Apply Theme
function applyTheme(theme, accentColor) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }

    // Remove all accent classes
    document.body.classList.remove('theme-purple', 'theme-blue', 'theme-green', 'theme-orange', 'theme-pink');

    if (accentColor && accentColor !== 'default') {
        document.body.classList.add(accentColor);
    }
}

// Expose to window
window.exportLibrary = exportLibrary;

// --- Audiobookshelf Integration ---
// Logic for managing Audiobookshelf server connections

const absServersList = document.getElementById('abs-servers-list');
const addAbsServerBtn = document.getElementById('add-abs-server-btn');
const addAbsServerForm = document.getElementById('add-abs-server-form-container');
const saveAbsServerBtn = document.getElementById('save-abs-server-btn');
const cancelAbsServerBtn = document.getElementById('cancel-abs-server-btn');

// ABS Event Listeners
if (addAbsServerBtn) {
    addAbsServerBtn.addEventListener('click', () => {
        addAbsServerForm.classList.remove('hidden');
        document.getElementById('new-abs-name').focus();
    });
}

if (cancelAbsServerBtn) {
    cancelAbsServerBtn.addEventListener('click', () => {
        addAbsServerForm.classList.add('hidden');
        clearAbsForm();
    });
}

if (saveAbsServerBtn) {
    saveAbsServerBtn.addEventListener('click', async () => {
        const name = document.getElementById('new-abs-name').value;
        const url = document.getElementById('new-abs-url').value;
        const username = document.getElementById('new-abs-username').value;
        const password = document.getElementById('new-abs-password').value;

        if (!name || !url || !username || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        saveAbsServerBtn.disabled = true;
        saveAbsServerBtn.textContent = 'Connecting...';

        try {
            const response = await fetch('http://localhost:3000/api/audiobookshelf/servers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ server_name: name, server_url: url, username, password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Connected to Audiobookshelf server!', 'success');
                addAbsServerForm.classList.add('hidden');
                clearAbsForm();
                loadAbsServers();
            } else {
                showToast(data.error || 'Failed to connect', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Network error', 'error');
        } finally {
            saveAbsServerBtn.disabled = false;
            saveAbsServerBtn.textContent = 'Connect';
        }
    });
}

function clearAbsForm() {
    document.getElementById('new-abs-name').value = '';
    document.getElementById('new-abs-url').value = '';
    document.getElementById('new-abs-username').value = '';
    document.getElementById('new-abs-password').value = '';
}

/**
 * Loads and displays the list of connected ABS servers
 */
async function loadAbsServers() {
    if (!authToken) return;

    try {
        const response = await fetch('http://localhost:3000/api/audiobookshelf/servers', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const servers = await response.json();

        if (servers.length === 0) {
            absServersList.innerHTML = '<p style="color:var(--text-secondary); padding:10px; text-align:center;">No servers connected.</p>';
            return;
        }

        absServersList.innerHTML = servers.map(server => `
            <div class="user-item">
                <div class="user-info">
                    <span class="user-name">${server.server_name}</span>
                    <span class="user-role" style="font-size:0.8em; color:var(--text-secondary);">${server.server_url}</span>
                </div>
                <div class="user-actions">
                    <span class="status-badge ${server.is_active ? 'status-active' : 'status-inactive'}" style="margin-right:10px;">
                        ${server.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button class="icon-btn delete-btn" onclick="deleteAbsServer(${server.id})" title="Remove Server">🗑️</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading ABS servers:', error);
        absServersList.innerHTML = '<p style="color:var(--danger-color); text-align:center;">Failed to load servers.</p>';
    }
}

window.deleteAbsServer = async function (id) {
    if (!confirm('Are you sure you want to remove this server? This will remove all synced books associated with it.')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/audiobookshelf/servers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showToast('Server removed', 'success');
            loadAbsServers();
        } else {
            showToast('Failed to remove server', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Network error', 'error');
    }
};

// Load servers when opening settings
const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) {
    settingsBtn.addEventListener('click', loadAbsServers);
}
