let socket;
let currentUser = null;
let currentRoom = null;

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
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const data = await fetchApi('/auth/login', 'POST', { email, password });
        handleAuthSuccess(data);
    } catch (err) {
        alert(err.message);
    }
}

async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    
    try {
        const data = await fetchApi('/auth/register', 'POST', { email, password, username, deviceId: 'test-client' });
        handleAuthSuccess(data);
    } catch (err) {
        alert(err.message);
    }
}

function handleAuthSuccess(data) {
    currentUser = data.user;
    localStorage.setItem('accessToken', data.accessToken);
    
    document.getElementById('authForms').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('displayUsername').innerText = currentUser.username;
    document.getElementById('displayEmail').innerText = currentUser.email;
    
    initSocket(data.accessToken);
}

function logout() {
    if (socket) socket.disconnect();
    currentUser = null;
    localStorage.removeItem('accessToken');
    document.getElementById('authForms').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    updateStatus(false);
}

function initSocket(token) {
    const wsUrl = wsUrlInput.value;
    socket = io(wsUrl, {
        auth: { token }
    });

    socket.on('connect', () => {
        updateStatus(true);
        addSystemMessage('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
        updateStatus(false);
        addSystemMessage('Disconnected from server');
    });

    socket.on('new_message', (msg) => {
        addMessage(msg);
    });

    socket.on('user_joined', (data) => {
        addSystemMessage(`${data.username} joined the room`);
    });

    socket.on('exception', (err) => {
        console.error('Socket error:', err);
        alert('Socket Error: ' + (err.message || 'Unknown error'));
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
    
    const time = new Date(msg.timestamp).toLocaleTimeString();
    
    msgEl.innerHTML = `
        <div class="username">${msg.username}</div>
        <div class="content">${escapeHtml(msg.content)}</div>
        <div class="time">${time}</div>
    `;
    
    messagesDiv.appendChild(msgEl);
    document.getElementById('chatWindow').scrollTop = document.getElementById('chatWindow').scrollHeight;
}

function addSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'system-msg';
    el.innerText = text;
    messagesDiv.appendChild(el);
    document.getElementById('chatWindow').scrollTop = document.getElementById('chatWindow').scrollHeight;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
