document.addEventListener('DOMContentLoaded', () => {
    // Slider functionality
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slide');
    const prev = document.querySelector('.prev');
    const next = document.querySelector('.next');
    let currentSlide = 0;

    if (slider && slides.length > 0 && prev && next) {
        function getSlidesPerView() {
            return window.innerWidth >= 768 ? 2 : 1;
        }

        function getTotalSlides() {
            const slidesPerView = getSlidesPerView();
            return Math.max(1, slides.length - (slidesPerView - 1));
        }

        function goToSlide(n) {
            const slidesPerView = getSlidesPerView();
            const slideWidth = 100 / slidesPerView;
            slider.style.transform = `translateX(-${n * slideWidth}%)`;
            currentSlide = n;
        }

        function updateSlider() {
            const totalSlides = getTotalSlides();
            currentSlide = Math.min(currentSlide, totalSlides - 1);
            goToSlide(currentSlide);
        }

        prev.addEventListener('click', () => {
            const totalSlides = getTotalSlides();
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            goToSlide(currentSlide);
        });

        next.addEventListener('click', () => {
            const totalSlides = getTotalSlides();
            currentSlide = (currentSlide + 1) % totalSlides;
            goToSlide(currentSlide);
        });

        window.addEventListener('resize', updateSlider);
        updateSlider();
    }

    indexLoadBlogPosts(1, 4);
    blogLoadBlogPosts(1, 5);
});

async function blogLoadBlogPosts(page = 1, limit = 5) {
    try {
        const response = await fetch(`/blog/posts?page=${page}&limit=${limit}`);
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
            pageButton.addEventListener('click', () => loadMore(i, limit));
            pagination.appendChild(pageButton);
        }
    } catch (err) {
        console.error('Failed to load posts:', err);
    }
}

async function indexLoadBlogPosts(page = 1, limit = 4) {
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

async function loadMoreBlogPosts(page, limit) {
    await loadPosts(page, limit);
}