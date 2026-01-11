let socket;
let currentUser = null;
let currentRoom = null;
let refreshInterval;

const apiUrlInput = document.getElementById('apiUrl');
const wsUrlInput = document.getElementById('wsUrl');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesDiv = document.getElementById('messages');

async function fetchApi(endpoint, method = 'GET', body = null) {
    const url = `${apiUrlInput.value}${endpoint}`;
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

// Session Persistence
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        try {
            // Check if token is valid and get user info
            const userInfo = await fetchApi('/auth/me', 'GET');
            
            // Normalize userId
            // API returns JwtUser: { userId, email, username }
            // Login returns: user: { id, email, username }
            if (userInfo.userId) userInfo.id = userInfo.userId;
            
            currentUser = userInfo;
            
            // Restore UI
            document.getElementById('authForms').style.display = 'none';
            document.getElementById('userInfo').style.display = 'block';
            document.getElementById('displayUsername').innerText = currentUser.username;
            document.getElementById('displayEmail').innerText = currentUser.email;
            
            // Connect Socket
            initSocket(token);

            // Start Auto-Refresh
            startAutoRefresh();

        } catch (err) {
            console.log('Token expired or invalid, clearing...', err);
            logout();
        }
    }
});

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validation
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    if (!email.includes('@')) {
        alert('Please enter a valid email');
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

    // Validation
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
    localStorage.setItem('refreshToken', data.refreshToken); // Store refresh token
    
    document.getElementById('authForms').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('displayUsername').innerText = currentUser.username;
    document.getElementById('displayEmail').innerText = currentUser.email;
    
    initSocket(data.accessToken);
    startAutoRefresh();
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
    }, 14 * 60 * 1000); // 14 minutes
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token');
    }

    // Call using fetch directly to avoid infinite loop with fetchApi wrapper if we add interceptors later
    // Using fetchApi here is fine as long as we don't auth-guard it with access token (which might be expired)
    // Actually our fetchApi adds AccessToken if present. It might be expired.
    // Ideally duplicate fetchApi logic or just use fetchApi and let server handle expired access token (but refresh endpoint likely public/guarded by refresh token)
    // The server Refresh endpoint extracts refresh token from body. The access token header is ignored by Refresh Guard usually or not required.
    // Let's use fetchApi but ensure we handle potential errors.
    
    const data = await fetchApi('/auth/refresh', 'POST', { 
        refresh_token: refreshToken 
    });
    
    localStorage.setItem('accessToken', data.accessToken);
    
    if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
    }
    
    console.log('Token refreshed successfully');
}

function logout() {
    if (socket) socket.disconnect();
    currentUser = null;
    currentRoom = null;
    clearInterval(refreshInterval);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    document.getElementById('authForms').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('messages').innerHTML = '';
    updateStatus(false);
}

function initSocket(token) {
    const wsUrl = wsUrlInput.value;
    socket = io(wsUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        updateStatus(true);
        addSystemMessage('Connected to WebSocket server');
        
        // Auto-rejoin room
        if (currentRoom) {
            socket.emit('join_room', { roomId: currentRoom });
        }
    });

    socket.on('disconnect', (reason) => {
        updateStatus(false);
        addSystemMessage(`Disconnected: ${reason}`);
    });

    socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        addSystemMessage('❌ Connection failed. Check your token or server.');
    });

    socket.on('new_message', (msg) => {
        addMessage(msg);
    });

    socket.on('user_joined', (data) => {
        addSystemMessage(`${data.username} joined the room`);
    });

    socket.on('user_left', (data) => {
        addSystemMessage(`${data.username} left the room`);
    });

    socket.on('exception', (err) => {
        console.error('Socket error:', err);
        addSystemMessage(`❌ Error: ${err.message}`);
    });
}

function updateStatus(isOnline) {
    const el = document.getElementById('connectionStatus');
    el.innerText = isOnline ? 'Connected' : 'Disconnected';
    el.className = isOnline ? 'status-online' : 'status-offline';
    sendBtn.disabled = !isOnline || !currentRoom;
}

function joinRoom() {
    const roomId = document.getElementById('roomId').value;
    if (!roomId) return;

    socket.emit('join_room', { roomId }, (response) => {
        if (response.success) {
            currentRoom = roomId;
            addSystemMessage(`Joined room: ${roomId}`);
            messagesDiv.innerHTML = ''; // Clear previous messages
            sendBtn.disabled = false;
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
