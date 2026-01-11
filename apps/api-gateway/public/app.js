let socket;
let currentUser = null;
let currentRoom = null;
let refreshInterval;

const apiUrlInput = document.getElementById('apiUrl');
const wsUrlInput = document.getElementById('wsUrl');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesDiv = document.getElementById('messages');

const currentPage = window.location.pathname.split('/').pop();

async function fetchApi(endpoint, method = 'GET', body = null) {
    const apiBase = apiUrlInput ? apiUrlInput.value : 'http://localhost:3000';
    const url = `${apiBase}${endpoint}`;
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
}

// Initialization and Routing Logic
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');

    if (currentPage === 'chat.html') {
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        await initChatPage(token);
    } else if (currentPage === 'login.html') {
        if (token) {
            // Optional: Validate token before redirecting?
            // For speed, just redirect. If invalid, chat page will bounce back.
            window.location.href = 'chat.html';
        }
    }
});

async function initChatPage(token) {
    try {
        const userInfo = await fetchApi('/auth/me', 'GET');
        
        if (userInfo.userId) userInfo.id = userInfo.userId;
        currentUser = userInfo;
        
        // Update UI
        const usernameDisplay = document.getElementById('displayUsername');
        if (usernameDisplay) usernameDisplay.innerText = currentUser.username;
        
        initSocket(token);
        startAutoRefresh();
    } catch (err) {
        console.log('Token invalid, redirecting to login...', err);
        logout();
    }
}

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    try {
        const data = await fetchApi('/auth/login', 'POST', { email, password });
        handleAuthSuccess(data);
    } catch (err) {
        alert(`Login failed: ${err.message}`);
    }
}

async function register() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value.trim();

    if (!email || !password || !username) {
        alert('Please fill all fields');
        return;
    }
    
    if (password.length < 12) {
        alert('Password must be at least 12 characters');
        return;
    }
    
    try {
        const data = await fetchApi('/auth/register', 'POST', { email, password, username, deviceId: 'test-client' });
        handleAuthSuccess(data);
    } catch (err) {
        alert(`Registration failed: ${err.message}`);
    }
}

function handleAuthSuccess(data) {
    currentUser = data.user;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    window.location.href = 'chat.html';
}

function startAutoRefresh() {
    clearInterval(refreshInterval);
    refreshInterval = setInterval(async () => {
        try {
            await refreshAccessToken();
        } catch (err) {
            console.error('Token refresh failed:', err);
            logout();
        }
    }, 14 * 60 * 1000);
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const data = await fetchApi('/auth/refresh', 'POST', { refresh_token: refreshToken });
    
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    
    console.log('Token refreshed successfully');
}

function logout() {
    if (socket) socket.disconnect();
    currentUser = null;
    currentRoom = null;
    clearInterval(refreshInterval);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    window.location.href = 'login.html';
}

function initSocket(token) {
    const wsBase = wsUrlInput ? wsUrlInput.value : 'http://localhost:3001';
    socket = io(wsBase, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        updateStatus(true);
        // Auto-rejoin logic if needed, but currentRoom is lost on refresh unless stored
    });

    socket.on('disconnect', (reason) => {
        updateStatus(false);
    });
    
    // ... other events ...
    socket.on('new_message', addMessage);
    socket.on('user_joined', (data) => addSystemMessage(`${data.username} joined`));
    socket.on('user_left', (data) => addSystemMessage(`${data.username} left`));
    socket.on('connect_error', (err) => console.error('Connection error:', err));
}

function updateStatus(isOnline) {
    const el = document.getElementById('connectionStatus');
    if (el) {
        el.innerText = isOnline ? 'Connected' : 'Disconnected';
        el.className = isOnline ? 'status-online' : 'status-offline';
    }
    if (sendBtn) sendBtn.disabled = !isOnline || !currentRoom;
}

function joinRoom() {
    const roomIdInput = document.getElementById('roomId');
    const roomId = roomIdInput.value;
    if (!roomId) return;

    socket.emit('join_room', { roomId }, (response) => {
        if (response.success) {
            currentRoom = roomId;
            addSystemMessage(`Joined room: ${roomId}`);
            if (messagesDiv) messagesDiv.innerHTML = '';
            if (sendBtn) sendBtn.disabled = false;
        }
    });
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentRoom) return;

    socket.emit('send_message', { roomId: currentRoom, content }, (response) => {
        if (response.success) {
            messageInput.value = '';
        }
    });
}

function addMessage(msg) {
    if (!messagesDiv) return;
    const isSent = msg.userId === currentUser.id;
    const msgEl = document.createElement('div');
    msgEl.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const timestamp = msg.timestamp || msg.createdAt || Date.now();
    const time = new Date(timestamp).toLocaleTimeString();
    
    msgEl.innerHTML = `
        <div class="username">${escapeHtml(msg.username || 'Anonymous')}</div>
        <div class="content">${escapeHtml(msg.content)}</div>
        <div class="time">${time}</div>
    `;
    
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
    if (!messagesDiv) return;
    const el = document.createElement('div');
    el.className = 'system-msg';
    el.innerText = text;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
