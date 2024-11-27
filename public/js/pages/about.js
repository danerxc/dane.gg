document.addEventListener('DOMContentLoaded', () => {
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
});