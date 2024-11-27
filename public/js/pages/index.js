document.addEventListener('DOMContentLoaded', () => {
    loadPosts(1, 4);
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