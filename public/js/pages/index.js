let ws;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let inactivityTimeout;
const messageSound = new Audio('/assets/sounds/notification.mp3');
let isChatSoundEnabled = getCookie('chatSoundEnabled') !== 'false';
let isInactiveDisconnect = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for all initial data loads
        await Promise.all([
            loadPosts(1, 4),
            updateNowPlaying(),
            updateStatus(),
            updateServices(),
            updateTweet(),
            getStats()
        ]);

        document.querySelector('.loading-overlay').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        document.querySelector('#oneko').style.display = 'block';

        // Start intervals after initial load
        setInterval(updateNowPlaying, 7500);
        setInterval(updateStatus, 7500);
        setInterval(updateServices, 7500);
        setInterval(updateTweet, 60000);

        // Initialize other features
        setupChat();
        openBtnHotlink();
        initializeChatSoundToggle();
    } catch (error) {
        console.error('Failed to load initial data:', error);
        // Show error message to user
        document.querySelector('.loading-content').innerHTML = '<h2>Failed to load content. Please refresh the page.</h2>';
    }
});

// =======================================
// >> BLOG SECTION
// =======================================
async function loadPosts(page = 1, limit = 4) {
    const response = await fetch(`/api/blog/posts/published?page=${page}&limit=${limit}`);
    const { posts, total } = await response.json();
    const container = document.getElementById('blog-index');

    container.innerHTML = '';

    if (posts.length === 0) {
        container.innerHTML = '<p>There are currently no posts</p>';
        return;
    } else {
        posts.forEach((post) => {
            const date = new Date(post.published_at).toISOString().split('T')[0];
            const postHTML = `
                <li><a href="/blog/${post.slug}" class="blog-post"><b>${date}</b> :: ${post.title}</a></li>
            `;
            container.innerHTML += postHTML;
        });
    }
}

// =======================================
// >> ONLINE/OFFLINE STATUS
// =======================================

async function updateStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();

        const statusEl = document.querySelector('.status-state');
        const statusExclaim = document.querySelector('.status-exclaim');
        if (statusEl) {
            statusEl.textContent = data.status ? 'ONLINE' : 'OFFLINE';
            statusEl.classList.toggle('online', data.status === 1);
            statusExclaim.classList.toggle('online', data.status === 1);
        }
    } catch (err) {
        console.error('Failed to update Discord status:', err);
    }
}

// =======================================
// >> SERVICE UPTIME TRACKING 
// =======================================

async function updateServices() {
    try {
        const response = await fetch('/api/services/status');
        const services = await response.json();

        Object.entries(services).forEach(([service, data]) => {
            const statusEl = document.querySelector(`.status-item[data-service="${service}"]`);
            if (statusEl) {
                const stateEl = statusEl.querySelector('.state');
                if (stateEl) {
                    stateEl.className = `state ${data.status ? 'ok' : 'down'}`;
                    stateEl.textContent = data.status ? '[ OK ]' : '[ DOWN ]';
                }
            }
        });
    } catch (err) {
        console.error('Failed to update services status:', err);
    }
}

// =======================================
// >> LAST.FM NOW/RECENTLY PLAYED SONG
// =======================================

async function updateNowPlaying() {
    try {
        const response = await fetch('/api/nowplaying');
        const track = await response.json();
        const playStatus = document.querySelector('.play-status');
        const trackTitle = document.querySelector('.track-title');
        const trackArtist = document.querySelector('.track-artist');
        const albumArt = document.querySelector('.current-album-art');
        const trackLastPlayed = document.querySelector('.track-last-played');

        if (track['@attr'] && track['@attr'].nowplaying) {
            playStatus.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="2 0 12 12"><circle cx="8" cy="8" r="4" fill="green"/></svg> Now Playing';
            trackLastPlayed.style.display = 'none';
        } else {
            playStatus.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="2 0 12 12"><circle cx="8" cy="8" r="4" fill="gray"/></svg> Recently Played';
            trackLastPlayed.style.display = 'block';
            trackLastPlayed.innerHTML = `Last Played: ${timeAgo(track.date.uts * 1000)}`;
        }

        trackTitle.innerHTML = `<span><a href="${track.url}" target="_blank">${track.name || 'Track Title'}</a></span>`;
        trackArtist.textContent = track.artist['#text'] || 'Artist Name';
        albumArt.src = track.image[2]['#text'] || 'assets/img/misc/music-placeholder.jpg';
    } catch (err) {
        console.error('Failed to update now playing:', err);
    }
}

// =======================================
// >> TWITTER LATEST TWEET
// =======================================

async function updateTweet() {
    try {
        const response = await fetch('/api/latest-tweet');
        const tweet = await response.json();

        const tweetTextEl = document.querySelector('.tweet-text');
        const postedDateEl = document.querySelector('.posted-date');
        const displayNameEl = document.querySelector('.display-name');
        const usernameEl = document.querySelector('.username');
        const profileImageEl = document.querySelector('.profile-image img');

        // Check for created_at instead of timestamp
        const tweetDate = tweet.created_at ? new Date(tweet.created_at) : null;

        if (tweetTextEl && tweet.text) {
            tweetTextEl.textContent = tweet.text;
        }

        if (displayNameEl && tweet.accountName) {
            displayNameEl.innerHTML = `<a href="https://twitter.com/${tweet.username}">${tweet.accountName}</a>`;
        }

        if (usernameEl && tweet.username) {
            usernameEl.textContent = `@${tweet.username}`;
        }

        if (profileImageEl && tweet.profilePicture) {
            profileImageEl.src = tweet.profilePicture;
            profileImageEl.alt = tweet.accountName;
        }

        if (postedDateEl && tweet.created_at) {
            const timestamp = Math.floor(new Date(tweet.created_at).getTime() / 1000);
            const timeAgo = timeAgoShort(timestamp);
            postedDateEl.textContent = timeAgo;
        }
    } catch (err) {
        console.error('Failed to update tweet:', err);
    }
}

// =======================================
// >> SITE STATS
// =======================================
async function getStats() {
    try {
        const response = await fetch('/api/web-stats');
        const data = await response.json();

        const totalElement = document.querySelector('.stat-value-total');
        const uniqueElement = document.querySelector('.stat-value-unique');

        animateValue(totalElement, 0, data.total_views, 1000);
        animateValue(uniqueElement, 0, data.unique_visitors, 1000);
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// =======================================
// >> WSS CHAT SYSTEM
// =======================================

// User Identification
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const userUUID = getCookie('userUUID') || (() => {
    const uuid = generateUUID();
    setCookie('userUUID', uuid, 365);
    return uuid;
})();

// Chat Manager Implementation
const chatManager = {
    ws: null,
    isConnecting: false,
    reconnectAttempts: 0,
    maxRetries: 5,
    reconnectTimeout: null,

    connect() {
        if (this.isInactiveDisconnect || 
            this.isConnecting || 
            this.ws?.readyState === WebSocket.CONNECTING || 
            this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        this.isConnecting = true;
        this.ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/chat`);

        this.ws.onopen = () => {
            console.log('Connected to chat');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            resetInactivityTimeout();
            addMessage({
                username: 'System',
                content: 'Connected to chat - please be respectful',
                timestamp: new Date().toISOString(),
                message_type: 'system'
            });
        };

        this.ws.onclose = () => {
            this.isConnecting = false;
            if (this.reconnectAttempts < this.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                this.reconnectAttempts++;
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = setTimeout(() => this.connect(), delay);
            }
            addMessage({
                username: 'System',
                content: 'Disconnected from chat',
                timestamp: new Date().toISOString(),
                message_type: 'system'
            });
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isConnecting = false;
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'history') {
                const messagesContainer = document.querySelector('.messages');
                if (messagesContainer) messagesContainer.innerHTML = '';
                data.data.reverse().forEach(msg => addMessage(msg));
                addMessage({
                    username: 'System',
                    content: 'Connected to chat - please be respectful',
                    timestamp: new Date().toISOString(),
                    message_type: 'system'
                });
            } else if (data.type === 'message') {
                addMessage(data.data);
            } else if (data.type === 'message_deleted') {
                document.querySelector(`.message[data-id="${data.messageId}"]`)?.remove();
            } else if (data.type === 'username_changed') {
                console.log('[Frontend Chat] Received username_changed event:', JSON.stringify(data));
                const targetUUID = data.userUUID; 
                const newUsername = data.newUsername;

                if (!targetUUID || typeof newUsername === 'undefined') {
                    console.error('[Frontend Chat] Invalid data in username_changed event:', data);
                    return;
                }

                const selector = `.message[data-uuid="${targetUUID}"] .nick`;
                console.log(`[Frontend Chat] Attempting to find elements with selector: "${selector}"`);
                
                const nickElements = document.querySelectorAll(selector);
                console.log(`[Frontend Chat] Found ${nickElements.length} nick elements to update for UUID ${targetUUID}.`);

                if (nickElements.length > 0) {
                    nickElements.forEach(nickEl => {
                        console.log(`[Frontend Chat] Updating nick element (current: "${nickEl.textContent}") to "<${newUsername}>"`);
                        nickEl.textContent = `<${newUsername}>`;
                    });
                } else {
                    console.warn(`[Frontend Chat] No messages found in DOM for UUID: ${targetUUID} to update username.`);
                }
            }
            resetInactivityTimeout();
        };
    },

    send(content) {
        if (this.ws?.readyState !== WebSocket.OPEN) return;

        this.ws.send(JSON.stringify({
            content: sanitizeMessage(content),
            username: getCookie('chatUsername') || 'Anonymous',
            userUUID,
            message_type: 'chat',
            message_color: '#ffffff'
        }));
    },

    disconnect(reason = 'manual') {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.isInactiveDisconnect = (reason === 'inactivity');

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
};

// Message Handling
function addMessage({ id, username, content, timestamp, message_type, message_color, userUUID: msgUUID, isHistorical }) {
    if (!isHistorical && msgUUID !== userUUID && username.toLowerCase() !== 'system') {
        playMessageSound();
    }

    const messages = document.querySelector('.messages');
    const messageDate = new Date(timestamp);
    const timeString = formatTimestamp(messageDate);

    let messageHTML = '';
    if (username === 'System') {
        const color = content.includes('Connected') ? '#abffb3' :
            content.includes('Disconnected') ? '#fca9a9' :
                content.includes('Username') ? '#abe6ff' : '#ffffff';

        messageHTML = `
        <div class="message" data-id="${id || ''}" data-uuid="${msgUUID || ''}">
            <span class="timestamp">[${timeString}]</span>
            <span class="nick">&lt;${username}&gt;</span>
            <span class="text" style="color: ${color}">${content}</span>
        </div>`;
    } else {
        const nickColor = message_type === 'Discord' ?
            `style="color: #${Number(message_color).toString(16).padStart(6, '0')}"` : '';

        messageHTML = `
        <div class="message" data-id="${id || ''}" data-uuid="${msgUUID || ''}">
            <span class="timestamp">[${timeString}]</span>
            <span class="nick" ${nickColor}>&lt;${username}&gt;</span>
            <span class="text">${content}</span>
        </div>`;
    }

    messages.innerHTML += messageHTML;
    messages.scrollTop = messages.scrollHeight;
}

// Utility Functions
function formatTimestamp(date) {
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return date.toLocaleString('en-US', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function sanitizeMessage(text) {
    return text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/`{3}[\s\S]*?`{3}/g, "[code block removed]")
        .replace(/`[\s\S]*?`/g, "[inline code removed]")
        .trim();
}

function handleCommand(input) {
    const match = input.match(/^\/nick\s+(.+)$/);
    if (match) {
        const newUsername = match[1].trim();
        if (newUsername) {
            setCookie('chatUsername', newUsername);
            addMessage({
                username: 'System',
                content: `Username changed to: ${newUsername}`,
                timestamp: new Date().toISOString(),
                message_type: 'system'
            });
            return true;
        }
    }
    return false;
}


function resetInactivityTimeout() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        document.querySelector('.messages').innerHTML = '';
        chatManager.disconnect('inactivity');
    }, 30000);
}

function playMessageSound() {
    if (isChatSoundEnabled) {
        messageSound.currentTime = 0;
        messageSound.play().catch(e => console.log('Error playing sound:', e));
    }
}

function setupChat() {
    const chatForm = document.querySelector('.chat-input');
    const chatInput = chatForm?.querySelector('input');
    const chatButton = chatForm?.querySelector('button');

    if (!chatForm || !chatInput || !chatButton) {
        console.error('Chat elements not found');
        return;
    }

    const handleUserActivity = () => {
        if (chatManager.isInactiveDisconnect) {
            chatManager.isInactiveDisconnect = false;
            chatManager.connect();
        }
        resetInactivityTimeout();
    };

    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    chatInput.addEventListener('focus', handleUserActivity);

    const sendMessage = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const content = chatInput.value.trim();
        if (!content) return;

        if (!handleCommand(content)) {
            chatManager.send(content);
        }

        chatInput.value = '';
        chatInput.focus();
    };

    chatForm.addEventListener('submit', sendMessage, false);
    chatButton.addEventListener('click', sendMessage, false);

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage(event);
        }
    }, false);

    chatManager.connect();
}

// =======================================
// >> TIME HELPER FUNCTIONS 
// =======================================

function timeAgo(timestamp) {
    const now = new Date();
    const secondsPast = (now.getTime() - timestamp) / 1000;

    if (secondsPast < 60) {
        return `${Math.floor(secondsPast)} seconds ago`;
    }
    if (secondsPast < 3600) {
        return `${Math.floor(secondsPast / 60)} minutes ago`;
    }
    if (secondsPast < 86400) {
        return `${Math.floor(secondsPast / 3600)} hours ago`;
    }
    if (secondsPast < 2592000) {
        return `${Math.floor(secondsPast / 86400)} days ago`;
    }
    if (secondsPast < 31536000) {
        return `${Math.floor(secondsPast / 2592000)} months ago`;
    }
    return `${Math.floor(secondsPast / 31536000)} years ago`;
}

function timeAgoShort(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const secondsPast = now - timestamp;

    if (secondsPast < 60) return `${Math.floor(secondsPast)}s`;
    if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)}m`;
    if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)}h`;
    if (secondsPast < 604800) return `${Math.floor(secondsPast / 86400)}d`;
    if (secondsPast < 2629800) return `${Math.floor(secondsPast / 604800)}w`;
    if (secondsPast < 31557600) return `${Math.floor(secondsPast / 2629800)}mo`;
    return `${Math.floor(secondsPast / 31557600)}y`;
}

// =======================================
// >> COOKIE HELPER FUNCTIONS 
// =======================================

function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// =======================================
// >> BUTTON HELPER FUNCTIONS
// =======================================

function openBtnHotlink() {
    const hotlinkText = document.querySelector('.hotlink-text .clickable');
    const dropdown = document.querySelector('.dropdown-content');

    hotlinkText.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });
}

function initializeChatSoundToggle() {
    const toggle = document.getElementById('chatSoundToggle');
    toggle.checked = isChatSoundEnabled;

    toggle.addEventListener('change', (e) => {
        isChatSoundEnabled = e.target.checked;
        setCookie('chatSoundEnabled', isChatSoundEnabled);
    });
}

// =======================================
// >> OTHER HELPER FUNCTIONS
// =======================================

function animateValue(element, start, end, duration) {
    const range = end - start;
    const minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);

    let startTime = new Date().getTime();
    let endTime = startTime + duration;
    let timer;

    function run() {
        let now = new Date().getTime();
        let remaining = Math.max((endTime - now) / duration, 0);
        let value = Math.round(end - (remaining * range));
        element.textContent = value;

        if (value == end) {
            clearInterval(timer);
        }
    }

    timer = setInterval(run, stepTime);
    run();
}