let ws;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let inactivityTimeout;
const messageSound = new Audio('/assets/sounds/notification.mp3');
let isChatSoundEnabled = getCookie('chatSoundEnabled') !== 'false';

document.addEventListener('DOMContentLoaded', () => {
    loadPosts(1, 4);
    updateNowPlaying();
    setInterval(updateNowPlaying, 7500);
    updateStatus();
    setInterval(updateStatus, 7500);
    updateServices();
    setInterval(updateServices, 7500);
    updateTweet();
    setInterval(updateTweet, 60000);
    setupChat();
    openBtnHotlink();
    openAdditionalMobile();
    initializeChatSoundToggle();
});

// =======================================
// >> BLOG SECTION
// =======================================
async function loadPosts(page = 1, limit = 4) {
    const response = await fetch(`/blog/posts?page=${page}&limit=${limit}`);
    const { posts, total } = await response.json();
    const container = document.getElementById('blog-index');

    container.innerHTML = '';

    if (posts.length === 0) {
        container.innerHTML = '<p>There are currently no posts</p>';
        return;
    } else {
        posts.forEach((post) => {
            const date = new Date(post.created_at).toISOString().split('T')[0];
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
// >> WSS CHAT SYSTEM
// =======================================

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let userUUID = getCookie('userUUID');
if (!userUUID) {
    userUUID = generateUUID();
    document.cookie = `userUUID=${userUUID};path=/;max-age=31536000`; // 1 year
}

function handleCommand(input) {
    const match = input.match(/^\/nick\s+(.+)$/);
    if (match) {
        const newUsername = match[1].trim();
        if (newUsername) {
            setCookie('chatUsername', newUsername);
            addMessage({ 
                username: 'system',
                content: `Username changed to: ${newUsername}`,
                timestamp: new Date().toISOString()
            });
            return true;
        }
    }
    return false;
}

function setupChat() {
    const messages = document.querySelector('.messages');
    const input = document.querySelector('.chat-input input');
    const button = document.querySelector('.chat-input button');

    function resetInactivityTimeout() {
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            messages.innerHTML = '';
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }, 30000); // 30 seconds
    }

    function connect() {
        ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/chat`);

        ws.onopen = () => {
            console.log('Connected to chat');
            reconnectAttempts = 0;
            resetInactivityTimeout();
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'history') {
                messages.innerHTML = '';
                data.data.reverse().forEach(msg => addMessage(msg));
                addMessage({
                    username: 'System',
                    content: 'Connected to chat server',
                    timestamp: new Date().toISOString()
                });
            } else if (data.type === 'message') {
                addMessage(data.data);
                messages.scrollTop = messages.scrollHeight;
            }
            resetInactivityTimeout();
        };

        ws.onclose = () => {
            console.log('Disconnected from chat');
            addMessage({
                username: 'System',
                content: 'Disconnected from chat',
                timestamp: new Date().toISOString()
            });
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    connect();

    function sendMessage() {
        const content = input.value.trim();
        if (!content) return;

        if (handleCommand(content)) {
            input.value = '';
            resetInactivityTimeout();
            return;
        }

        if (ws.readyState === WebSocket.OPEN) {
            const username = getCookie('chatUsername') || 'Anonymous';
            const message = JSON.stringify({
                username,
                content,
                timestamp: new Date().toISOString(),
                message_type: 'Web',
                message_color: null,
                userUUID: userUUID
            });
            console.log('Sending message:', message);
            ws.send(message);
            input.value = '';
            resetInactivityTimeout();
        } else {
            addMessage({
                username: 'System',
                content: 'Not connected to chat server',
                timestamp: new Date()
            });
        }
    }

    function reconnectOnInteraction() {
        if (ws.readyState !== WebSocket.OPEN) {
            connect();
        }
    }

    button.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
        resetInactivityTimeout();
    });

    document.addEventListener('mousemove', resetInactivityTimeout);
    document.addEventListener('keydown', resetInactivityTimeout);

    document.addEventListener('mousemove', reconnectOnInteraction);
    document.addEventListener('keydown', reconnectOnInteraction);
}

function playMessageSound() {
    if (isChatSoundEnabled) {
        messageSound.currentTime = 0;
        messageSound.play().catch(e => console.log('Error playing sound:', e));
    }
}

function addMessage({ username, content, timestamp, message_type, message_color, userUUID, isHistorical }) {
    if (!isHistorical && 
        userUUID !== getCookie('userUUID') && 
        username.toLowerCase() !== 'system') {
        playMessageSound();
    }
    
    const messages = document.querySelector('.messages');
    const messageDate = new Date(timestamp);
    const now = new Date();
    let timeString;

    if (messageDate.toDateString() === now.toDateString()) {
        timeString = messageDate.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        timeString = messageDate.toLocaleString('en-US', { 
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function decimalToHex(decimal) {
        const hex = Number(decimal).toString(16).padStart(6, '0');
        return `#${hex}`;
    }

    if (message_type === 'Discord') {
        messages.innerHTML += `
            <div class="message">
                <span class="timestamp">[${timeString}]</span>
                <span class="nick" style="color: ${decimalToHex(message_color)}">&lt;${username}&gt;</span>
                <span class="text">${content}</span>
            </div>
        `;
    } else {
        messages.innerHTML += `
        <div class="message">
            <span class="timestamp">[${timeString}]</span>
            <span class="nick">&lt;${username}&gt;</span>
            <span class="text">${content}</span>
        </div>
    `;
    }
    messages.scrollTop = messages.scrollHeight;
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

function openAdditionalMobile() {
    const toggle = document.querySelector('.left-column-toggle');
    const leftColumn = document.querySelector('.left-column');

  toggle.addEventListener('click', () => {
    leftColumn.classList.toggle('show');
    toggle.classList.toggle('active');
    toggle.textContent = leftColumn.classList.contains('show') ? 'Hide Widgets' : 'Show Widgets';
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