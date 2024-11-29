document.addEventListener('DOMContentLoaded', () => {
    loadPosts(1, 4);
    updateNowPlaying();
    setInterval(updateNowPlaying, 7500);
    updateStatus();
    setInterval(updateStatus, 7500);
    updateServices();
    setInterval(updateServices, 7500);
    updateTweet();
    setInterval(updateTweet, 7500);
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
            const date = new Date(post.created_at).toISOString().split('T')[0];
    
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
            playStatus.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="2 0 12 12"><circle cx="8" cy="8" r="4" fill="gray"/></svg> Recently Played';
            if (track.date && track.date.uts) {
                const timeAgoText = timeAgo(track.date.uts);
                trackLastPlayed.textContent = `Last played: ${timeAgoText}`;
                trackLastPlayed.style.display = 'block';
            } else {
                trackLastPlayed.style.display = 'none';
            }
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
      displayNameEl.textContent = tweet.accountName;
    }
    
    if (usernameEl && tweet.username) {
      usernameEl.textContent = `@${tweet.username}`;
    }
    
    if (profileImageEl && tweet.profilePicture) {
      profileImageEl.src = tweet.profilePicture;
      profileImageEl.alt = tweet.accountName;
    }
    
    if (postedDateEl && tweet.created_at) {
      const timestamp = new Date(tweet.created_at).getTime() / 1000;
      postedDateEl.textContent = timeAgoShort(timestamp);
    }
  } catch (err) {
    console.error('Failed to update tweet:', err);
  }
}

function timeAgo(timestamp) {
    const now = new Date();
    const secondsPast = (now.getTime() - timestamp * 1000) / 1000;

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
    const date = timestamp * 1000;
    const now = Date.now();
    
    const secondsPast = Math.floor((now - date) / 1000);

    if (secondsPast < 60) return `${secondsPast}s`;
    if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)}m`;
    if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)}h`; 
    if (secondsPast < 604800) return `${Math.floor(secondsPast / 86400)}d`;
    if (secondsPast < 31536000) return `${Math.floor(secondsPast / 604800)}w`;
    return `${Math.floor(secondsPast / 31536000)}y`;
}