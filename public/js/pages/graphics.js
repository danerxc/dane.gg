document.addEventListener('DOMContentLoaded', () => {
    initializeGraphics();
});

async function initializeGraphics() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    const mainContainer = document.querySelector('.container');
    const oneko = document.querySelector('#oneko');

    if (!loadingOverlay || !mainContainer) {
        console.error('Required DOM elements not found');
        return;
    }

    try {
        await loadGraphicsProjects();

        loadingOverlay.style.display = 'none';
        mainContainer.style.display = 'block';
        oneko.style.display = 'block';

    } catch (error) {
        console.error('Failed to load initial data:', error);
        const loadingContent = loadingOverlay.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.innerHTML = '<h2>Failed to load content. Please refresh the page.</h2>';
        }
    }
}

async function loadGraphicsProjects() {
    try {
        const categoriesResponse = await fetch('/api/projects/categories');
        if (!categoriesResponse.ok) {
            throw new Error(`Failed to fetch categories. Status: ${categoriesResponse.status}`);
        }
        const categories = await categoriesResponse.json();

        const developmentCategory = categories.find(
            (category) => category.name.toLowerCase() === 'graphics'
        );

        if (!developmentCategory) {
            throw new Error("Graphics category not found.");
        }

        const developmentCategoryId = developmentCategory.id;

        const response = await fetch(`/api/projects/category/${developmentCategoryId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects. Status: ${response.status}`);
        }

        const projects = await response.json();

        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';

        grid.innerHTML = `
            <div class="projects-row">
                ${projects.map(project => `
                    <div class="card project-card" data-category="${project.category_name}">
                        ${project.image_url ? `<img src="${project.image_url}" alt="${project.title}">` : ''}
                        <h3>${project.title}</h3>
                        <div class="project-tags">
                            ${project.tags ? project.tags.map(tag => `
                                <span class="project-tag" style="background-color: ${tag.color};">${tag.title}</span>
                            `).join('') : ''}
                        </div>
                        <div class="project-description">
                            ${marked.parse(project.description)}
                        </div>
                        <div class="project-links">
                            ${project.project_url ? `<button class="project-card-button" data-url="${project.project_url}">
                                ${project.project_text || 'View Project'}
                            </button>` : ''}
                            ${project.repo_url ? `<button class="project-card-button" data-url="${project.repo_url}">
                                ${project.repo_text || 'View Repository'}
                            </button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const buttons = grid.querySelectorAll('.project-card-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const url = button.getAttribute('data-url');
                if (url) {
                    window.open(url, '_blank');
                }
            });
        });
    } catch (err) {
        console.error('Failed to load projects:', err);
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '<div class="error-message">Failed to load projects. Please try again later.</div>';
    }
}