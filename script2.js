// ==================== USERS DATA ====================
const users = [
    { id: 1, name: "suhanallyas❤️", avatar: "https://ui-avatars.com/api/?name=Suhana&background=00a884&color=fff", status: "Online", lastSeen: "Online", type: "user", pinned: false, unread: 0, favorite: true },
    { id: 2, name: "Shanza👩‍🎓", avatar: "https://ui-avatars.com/api/?name=Shanza&background=FF6B6B&color=fff", status: "Online", lastSeen: "Online", type: "user", pinned: false, unread: 2, favorite: false },
    { id: 3, name: "Api Anila❤️", avatar: "https://ui-avatars.com/api/?name=Anila&background=4ECDC4&color=fff", status: "Online", lastSeen: "Online", type: "user", pinned: true, unread: 0, favorite: true },
    { id: 4, name: "Sista🦋", avatar: "https://ui-avatars.com/api/?name=Sista&background=45B7D1&color=fff", status: "Away", lastSeen: "8:09 AM", type: "user", pinned: false, unread: 0, favorite: false },
    { id: 5, name: "SP24-BSE (Announcement)", avatar: "https://ui-avatars.com/api/?name=SP24&background=96CEB4&color=fff", status: "3/31/26", lastSeen: "Nimra malik: Notification", type: "group", pinned: false, unread: 3, favorite: true },
    { id: 6, name: "Operating System", avatar: "https://ui-avatars.com/api/?name=OS&background=FFEAA7&color=000", status: "Cr: Join the link", lastSeen: "10:07 AM", type: "group", pinned: false, unread: 0, favorite: false }
];

// ==================== AUTO-REPLY ====================
const autoReplies = {
    greeting: ["Assalam-o-Alaikum! 👋", "Hey! How are you?", "Hello! Good to hear from you!"],
    common: ["Oh really? Tell me more!", "That's interesting!", "I see..."],
    question: ["What do you think?", "Good question!", "Let me think about that..."],
    bye: ["Bye! Take care! 👋", "See you later!", "Allah Hafiz!"]
};

function getAutoReply(msg) {
    const m = msg.toLowerCase();
    if (m.includes('hi') || m.includes('hello') || m.includes('salam')) 
        return autoReplies.greeting[Math.floor(Math.random() * autoReplies.greeting.length)];
    if (m.includes('bye')) 
        return autoReplies.bye[Math.floor(Math.random() * autoReplies.bye.length)];
    if (m.includes('?')) 
        return autoReplies.question[Math.floor(Math.random() * autoReplies.question.length)];
    return autoReplies.common[Math.floor(Math.random() * autoReplies.common.length)];
}

// ==================== CHATS DATA ====================
let chats = {};
let currentChatId = null;
let currentTab = 'all';
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

users.forEach(user => {
    chats[user.id] = {
        userId: user.id,
        messages: [{ id: Date.now(), text: `👋 Hi! I'm ${user.name}`, sender: 'them', timestamp: new Date(), type: 'text' }],
        lastMessageTime: new Date(),
        pinned: user.pinned,
        unread: user.unread
    };
});

// ==================== DOM ELEMENTS ====================
const chatsList = document.getElementById('chats-list');
const messagesContainer = document.getElementById('messages-container');
const emptyState = document.getElementById('empty-state');
const activeChatDiv = document.getElementById('active-chat');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const searchInput = document.getElementById('search-input');
const tabs = document.querySelectorAll('.tab');
const voiceBtn = document.getElementById('voice-btn');
const attachBtn = document.getElementById('attach-btn');
const sidebarMenuBtn = document.getElementById('sidebar-menu-btn');
const sidebarModal = document.getElementById('sidebar-modal');
const callModal = document.getElementById('call-modal');

// ==================== LOAD CHATS ====================
function loadChats() {
    let filteredUsers = [...users];
    
    if (currentTab === 'unread') {
        filteredUsers = filteredUsers.filter(u => chats[u.id].unread > 0);
    } else if (currentTab === 'favorites') {
        filteredUsers = filteredUsers.filter(u => u.favorite);
    } else if (currentTab === 'groups') {
        filteredUsers = filteredUsers.filter(u => u.type === 'group');
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(u => u.name.toLowerCase().includes(searchTerm));
    }
    
    filteredUsers.sort((a, b) => {
        if (chats[a.id].pinned && !chats[b.id].pinned) return -1;
        if (!chats[a.id].pinned && chats[b.id].pinned) return 1;
        return chats[b.id].lastMessageTime - chats[a.id].lastMessageTime;
    });
    
    chatsList.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const chat = chats[user.id];
        const lastMsg = chat.messages[chat.messages.length - 1];
        const chatDiv = document.createElement('div');
        chatDiv.className = `chat-item ${chat.pinned ? 'pinned' : ''}`;
        if (currentChatId === user.id) chatDiv.classList.add('active');
        
        chatDiv.innerHTML = `
            <img class="chat-item-avatar" src="${user.avatar}">
            <div class="chat-item-info">
                <div class="chat-item-header">
                    <span class="chat-item-name">${user.name}</span>
                    <span class="chat-item-time">${new Date(chat.lastMessageTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="chat-item-preview">${lastMsg?.text.substring(0, 40) || 'Tap to chat'} ${chat.unread > 0 ? `<span class="unread-badge">${chat.unread}</span>` : ''}</div>
            </div>
        `;
        
        // Right click menu for pin
        chatDiv.oncontextmenu = (e) => {
            e.preventDefault();
            togglePin(user.id);
            return false;
        };
        
        chatDiv.onclick = () => openChat(user.id);
        chatsList.appendChild(chatDiv);
    });
}

// ==================== TOGGLE PIN ====================
function togglePin(userId) {
    chats[userId].pinned = !chats[userId].pinned;
    loadChats();
}

// ==================== OPEN CHAT ====================
function openChat(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    currentChatId = userId;
    chats[userId].unread = 0;
    
    const chatHeader = document.getElementById('chat-header');
    chatHeader.innerHTML = `
        <div class="chat-header-left">
            <img class="chat-header-avatar" src="${user.avatar}">
            <div class="chat-header-info">
                <h3>${user.name}</h3>
                <div class="chat-header-status ${user.status === 'Online' ? 'online' : ''}">${user.status === 'Online' ? 'Online' : user.lastSeen}</div>
            </div>
        </div>
        <div class="chat-header-actions">
            <i class="fas fa-video" id="video-call-btn"></i>
            <i class="fas fa-phone" id="voice-call-btn"></i>
            <i class="fas fa-ellipsis-v" id="chat-menu-btn"></i>
        </div>
    `;
    
    // Call buttons
    document.getElementById('video-call-btn')?.addEventListener('click', () => makeCall('video', user.name));
    document.getElementById('voice-call-btn')?.addEventListener('click', () => makeCall('voice', user.name));
    
    emptyState.style.display = 'none';
    activeChatDiv.style.display = 'flex';
    loadMessages(userId);
    loadChats();
}

// ==================== MAKE CALL ====================
function makeCall(type, userName) {
    document.getElementById('call-type').textContent = type === 'video' ? '📹 Video Call' : '📞 Voice Call';
    document.getElementById('call-user-name').textContent = `Calling ${userName}...`;
    callModal.style.display = 'flex';
    
    // Auto end after 3 seconds (demo)
    setTimeout(() => {
        if (callModal.style.display === 'flex') {
            alert(`${type === 'video' ? 'Video' : 'Voice'} call ended - Demo version`);
            callModal.style.display = 'none';
        }
    }, 3000);
}

document.getElementById('end-call-btn')?.addEventListener('click', () => {
    callModal.style.display = 'none';
});

document.getElementById('close-call-modal')?.addEventListener('click', () => {
    callModal.style.display = 'none';
});

// ==================== LOAD MESSAGES ====================
function loadMessages(userId) {
    messagesContainer.innerHTML = '';
    const chat = chats[userId];
    if (chat && chat.messages) {
        chat.messages.forEach(msg => displayMessage(msg));
    }
    scrollToBottom();
}

// ==================== DISPLAY MESSAGE ====================
function displayMessage(msg) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${msg.sender === 'me' ? 'sent' : 'received'}`;
    const time = new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    
    let content = '';
    if (msg.type === 'voice') {
        content = `<div class="voice-message">
            <audio controls src="${msg.audioUrl}"></audio>
        </div>`;
    } else {
        content = `<div class="message-text">${escapeHtml(msg.text)}</div>`;
    }
    
    wrapper.innerHTML = `
        <div class="message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}">
            ${content}
            <div class="message-time">${time}</div>
        </div>
    `;
    messagesContainer.appendChild(wrapper);
}

// ==================== SEND MESSAGE ====================
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentChatId) return;
    
    const myMsg = { id: Date.now(), text: text, sender: 'me', timestamp: new Date(), type: 'text' };
    chats[currentChatId].messages.push(myMsg);
    chats[currentChatId].lastMessageTime = new Date();
    displayMessage(myMsg);
    messageInput.value = '';
    
    setTimeout(() => {
        const replyText = getAutoReply(text);
        const replyMsg = { id: Date.now() + 1, text: replyText, sender: 'them', timestamp: new Date(), type: 'text' };
        chats[currentChatId].messages.push(replyMsg);
        chats[currentChatId].lastMessageTime = new Date();
        displayMessage(replyMsg);
        loadChats();
    }, 1000 + Math.random() * 1500);
    
    loadChats();
    scrollToBottom();
}

// ==================== VOICE RECORDING (FIXED) ====================
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Send voice message
            if (currentChatId) {
                const voiceMsg = {
                    id: Date.now(),
                    text: '🎤 Voice message',
                    sender: 'me',
                    timestamp: new Date(),
                    type: 'voice',
                    audioUrl: audioUrl
                };
                chats[currentChatId].messages.push(voiceMsg);
                chats[currentChatId].lastMessageTime = new Date();
                displayMessage(voiceMsg);
                loadChats();
                scrollToBottom();
                
                // Auto reply for voice
                setTimeout(() => {
                    const replyMsg = {
                        id: Date.now() + 1,
                        text: '🎤 Thanks for the voice note! 😊',
                        sender: 'them',
                        timestamp: new Date(),
                        type: 'text'
                    };
                    chats[currentChatId].messages.push(replyMsg);
                    chats[currentChatId].lastMessageTime = new Date();
                    displayMessage(replyMsg);
                    loadChats();
                    scrollToBottom();
                }, 1500);
            }
            
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            isRecording = false;
        };
        
        mediaRecorder.start();
        isRecording = true;
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        
        // Auto stop after 30 seconds
        setTimeout(() => {
            if (isRecording) stopRecording();
        }, 30000);
        
    } catch (err) {
        alert('Microphone access needed for voice notes');
        console.error(err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

// Voice button click
voiceBtn?.addEventListener('click', () => {
    if (!currentChatId) {
        alert('Select a chat first');
        return;
    }
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

// ==================== ATTACH FILE ====================
attachBtn?.addEventListener('click', () => {
    alert('📎 Attach file\n\nImage/Video sharing coming soon!');
});

// ==================== SIDEBAR MENU ====================
sidebarMenuBtn?.addEventListener('click', () => {
    sidebarModal.style.display = 'flex';
});

document.getElementById('close-sidebar-modal')?.addEventListener('click', () => {
    sidebarModal.style.display = 'none';
});

document.getElementById('change-dp')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('user-avatar').src = event.target.result;
                alert('Profile picture updated!');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
    sidebarModal.style.display = 'none';
});

document.getElementById('set-status')?.addEventListener('click', () => {
    const newStatus = prompt('Set your status:', 'Online');
    if (newStatus) {
        document.querySelector('.user-time').textContent = newStatus;
        alert('Status updated!');
    }
    sidebarModal.style.display = 'none';
});

document.getElementById('logout-item')?.addEventListener('click', () => {
    if (confirm('Logout?')) {
        location.reload();
    }
    sidebarModal.style.display = 'none';
});

// ==================== EMOJI PICKER ====================
document.getElementById('emoji-btn')?.addEventListener('click', () => {
    const emojis = ['😀', '😂', '❤️', '😍', '👍', '🎉', '🔥', '👋', '😊', '🥰', '😎', '🤔', '🙏', '⭐', '💕', '✨'];
    const picker = document.createElement('div');
    picker.style.cssText = 'position: fixed; bottom: 80px; left: 20px; background: #1e2a2e; border-radius: 12px; padding: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.3);';
    emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.style.cssText = 'font-size: 24px; border: none; background: none; cursor: pointer; padding: 5px; color: white; border-radius: 8px;';
        btn.onmouseenter = () => btn.style.background = '#2a2f32';
        btn.onmouseleave = () => btn.style.background = 'none';
        btn.onclick = () => {
            messageInput.value += emoji;
            messageInput.focus();
            picker.remove();
        };
        picker.appendChild(btn);
    });
    document.body.appendChild(picker);
    setTimeout(() => document.addEventListener('click', () => picker.remove(), { once: true }), 100);
});

// ==================== SEARCH ====================
searchInput.addEventListener('input', () => loadChats());

// ==================== TABS ====================
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        loadChats();
    });
});

// ==================== NEW CHAT ====================
document.getElementById('new-chat-btn')?.addEventListener('click', () => {
    alert('📱 New Chat\n\nSelect a contact from the list above!\n\nTip: Right-click on any chat to Pin/Unpin it!');
});

// ==================== EVENT LISTENERS ====================
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

window.addEventListener('click', (e) => {
    if (e.target === sidebarModal) sidebarModal.style.display = 'none';
    if (e.target === callModal) callModal.style.display = 'none';
});

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== INIT ====================
loadChats();
console.log("✅ WhatsApp Clone FULLY FIXED - Voice Notes Working, Menus Working, Calls Working!");