document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slide');
    const prev = document.querySelector('.prev');
    const next = document.querySelector('.next');
    let currentSlide = 0;

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

    function updateSlider() {
        const totalSlides = getTotalSlides();
        currentSlide = Math.min(currentSlide, totalSlides - 1);
        goToSlide(currentSlide);
    }

    updateSlider();

    // setInterval(() => {
    //     const totalSlides = getTotalSlides();
    //     currentSlide = (currentSlide + 1) % totalSlides;
    //     goToSlide(currentSlide);
    // }, 5000);
});

async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        const container = document.getElementById('blog-posts');
        
        posts.forEach(post => {
            const date = new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            container.innerHTML += `
                <div class="card blog-post-card">
                    <article>
                        <header>
                            <h2><a href="/blog/${post.slug}">${post.title}</a></h2>
                            <div class="post-meta">
                                <time datetime="${post.created_at}">${date}</time>
                            </div>
                        </header>
                        <div class="post-excerpt">
                            <p>${post.excerpt || ''}</p>
                        </div>
                        <footer>
                            <a href="/blog/${post.slug}" class="read-more">Read more →</a>
                        </footer>
                    </article>
                </div>
            `;
        });
    } catch (err) {
        console.error('Failed to load posts:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadPosts);