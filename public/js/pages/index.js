let ws;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let inactivityTimeout;

document.addEventListener('DOMContentLoaded', () => {
    loadPosts(1, 4);
    updateNowPlaying();
    setInterval(updateNowPlaying, 7500);
    updateStatus();
    setInterval(updateStatus, 7500);
    updateServices();
    setInterval(updateServices, 7500);
    updateTweet();
    setInterval(updateTweet, 300000);
    setupChat();
});

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
            const date = new Date(post.timestamp).toISOString().split('T')[0];
            const postHTML = `
                <li><a href="/blog/${post.slug}" class="blog-post"><b>${date}</b> :: ${post.title}</a></li>
            `;
            container.innerHTML += postHTML;
        });
    }
}

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
            playStatus.textContent = 'Recently played';
            trackLastPlayed.style.display = 'block';
            trackLastPlayed.textContent = timeAgo(new Date(track.date.uts * 1000));
        }
        
        trackTitle.innerHTML = `<span><a href="${track.url}" target="_blank">${track.name || 'Track Title'}</a></span>`;
        trackArtist.textContent = track.artist['#text'] || 'Artist Name';
        albumArt.src = track.image[2]['#text'] || 'assets/img/misc/music-placeholder.jpg';
    } catch (err) {
        console.error('Failed to update now playing:', err);
    }
}

async function updateTweet() {
    try {
        const response = await fetch('/api/latest-tweet');
        const tweet = await response.json();
        
        const tweetTextEl = document.querySelector('.tweet-text');
        const postedDateEl = document.querySelector('.posted-date');
        const displayNameEl = document.querySelector('.display-name');
        const usernameEl = document.querySelector('.username');
        const profileImageEl = document.querySelector('.profile-image img');
        
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
        
        if (postedDateEl && tweet.timestamp) {
            const timestamp = new Date(tweet.timestamp).getTime() / 1000;
            postedDateEl.textContent = timeAgoShort(timestamp);
        }
    } catch (err) {
        console.error('Failed to update tweet:', err);
    }
}

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
    const date = new Date(timestamp * 1000);
    const now = Date.now();
    
    const secondsPast = Math.floor((now - date) / 1000);

    if (secondsPast < 60) return `${secondsPast}s`;
    if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)}m`;
    if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)}h`; 
    if (secondsPast < 604800) return `${Math.floor(secondsPast / 86400)}d`;
    if (secondsPast < 31536000) return `${Math.floor(secondsPast / 604800)}w`;
    return `${Math.floor(secondsPast / 31536000)}y`;
}

function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
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
                timestamp: new Date()
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
            addMessage({
                username: 'system',
                content: 'Connected to chat server',
                timestamp: new Date().toISOString()
            });
            resetInactivityTimeout();
        };

        ws.onmessage = (event) => {
            console.log('Received message:', event.data);
            const data = JSON.parse(event.data);
            
            if (data.type === 'history') {
                messages.innerHTML = '';
                data.data.reverse().forEach(msg => addMessage(msg));
            } else if (data.type === 'message') {
                addMessage(data.data);
                messages.scrollTop = messages.scrollHeight;
            }
            resetInactivityTimeout();
        };

        ws.onclose = () => {
            console.log('Disconnected from chat');
            addMessage({
                username: 'system',
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
            const username = getCookie('chatUsername') || 'user';
            const message = JSON.stringify({
                username,
                content,
                timestamp: new Date().toISOString()
            });
            console.log('Sending message:', message);
            ws.send(message);
            input.value = '';
            resetInactivityTimeout();
        } else {
            console.error('WebSocket not connected');
            addMessage({
                username: 'system',
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

    // Reset inactivity timer on any user interaction
    messages.addEventListener('click', resetInactivityTimeout);
    input.addEventListener('click', resetInactivityTimeout);
    button.addEventListener('click', resetInactivityTimeout);
    document.addEventListener('mousemove', resetInactivityTimeout);
    document.addEventListener('keydown', resetInactivityTimeout);

    // Reconnect on interaction
    messages.addEventListener('click', reconnectOnInteraction);
    input.addEventListener('click', reconnectOnInteraction);
    button.addEventListener('click', reconnectOnInteraction);
}

function addMessage({ username, content, timestamp }) {
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

    messages.innerHTML += `
        <div class="message">
            <span class="timestamp">[${timeString}]</span>
            <span class="nick">&lt;${username}&gt;</span>
            <span class="text">${content}</span>
        </div>
    `;
    messages.scrollTop = messages.scrollHeight;
}