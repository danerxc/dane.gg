document.addEventListener('DOMContentLoaded', () => {
    loadGraphicsProjects();
});

async function loadGraphicsProjects() {
    try {
        const response = await fetch('/services/projects/category/graphics');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const projects = await response.json();
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';

        grid.innerHTML = `
            <div class="projects-row">
                ${projects.map(project => `
                    <div class="card project-card ${project.featured ? 'featured' : ''}" data-category="${project.category}">
                        ${project.image_url ? `<img src="${project.image_url}" alt="${project.title}">` : ''}
                        <h3>${project.title}</h3>
                        <div class="project-tags">
                            ${project.tags.map(tag => `
                                <span class="project-tag" style="background-color: ${tag.color};">${tag.title}</span>
                            `).join('')}
                        </div>
                        <p>${project.description}</p>
                        <div class="project-links">
                            ${project.project_url ? `<button class="project-card-button" data-url="${project.project_url}">${project.project_text || 'View Project'}</button>` : ''}
                            ${project.repo_url ? `<button class="project-card-button" data-url="${project.repo_url}">${project.repo_text || 'View Repository'}</button>` : ''}
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
        grid.innerHTML = '<div class="error-message">Failed to load projects. Please try again later.</div>';
    }
}