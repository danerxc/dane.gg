document.addEventListener('DOMContentLoaded', () => {
    const rainContainer = document.querySelector('.rain-container');

    function createRaindrop() {
        const raindrop = document.createElement('div');
        raindrop.classList.add('raindrop');

        // Random horizontal position
        raindrop.style.left = `${Math.random() * window.innerWidth}px`;

        // Random animation duration for variation
        const dropDuration = 1 + Math.random() * 1;
        raindrop.style.animationDuration = `${dropDuration}s`;

        rainContainer.appendChild(raindrop);

        raindrop.addEventListener('animationend', () => {
            // Get raindrop's ending position
            const rect = raindrop.getBoundingClientRect();
            const xPosition = rect.left;
            const yPosition = rect.top;

            createSplash(xPosition, yPosition);
            raindrop.remove();
        });
    }

    function createSplash(xPosition, yPosition) {
        const splash = document.createElement('div');
        splash.classList.add('splash');

        splash.style.left = `${xPosition}px`;
        splash.style.top = `${yPosition}px`;

        rainContainer.appendChild(splash);

        splash.addEventListener('animationend', () => {
            splash.remove();
        });
    }

    // Create raindrops at intervals
    setInterval(createRaindrop, 100);
});