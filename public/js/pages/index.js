document.addEventListener('DOMContentLoaded', () => {
    loadPosts(1, 4);
    updateNowPlaying();
    setInterval(updateNowPlaying, 7500);
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