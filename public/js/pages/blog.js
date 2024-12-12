document.addEventListener('DOMContentLoaded', () => {
    loadPosts(1, 5);
});

async function loadPosts(page, limit) {
    try {
        const response = await fetch(`/api/blog/posts/published?page=${page}&limit=${limit}`);
        const { posts, total } = await response.json();
        const grid = document.getElementById('blog-grid');
        const pagination = document.getElementById('pagination');

        grid.innerHTML = '';
        pagination.innerHTML = '';

        if (posts.length === 0) {
            grid.innerHTML = '<h2>There are currently no posts</h2>';
            return;
        } else {
            posts.forEach((post) => {
                const date = new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
    
                let postHTML = `
                    <div class="card blog-post-card">
                        <article>
                            <header>
                                ${post.thumbnail ? `<img src="${post.thumbnail}" alt="${post.title}" class="blog-post-thumbnail" />` : ''}
                                <h2><a href="/blog/${post.slug}">${post.title}</a></h2>
                                <div class="post-meta">
                                    <time datetime="${post.created_at}">${date}</time>
                                </div>
                            </header>
                            <footer>
                                <a href="/blog/${post.slug}" class="read-more">Read more →</a>
                            </footer>
                        </article>
                    </div>
                `;
                    grid.innerHTML += postHTML;
                });
        }

        const totalPages = Math.ceil(total / limit);
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.add('page-button');
            if (i === page) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => loadMorePosts(i, limit));
            pagination.appendChild(pageButton);
        }
    } catch (err) {
        console.error('Failed to load posts:', err);
    }
}

async function loadMorePosts(page, limit) {
    await loadPosts(page, limit);
}