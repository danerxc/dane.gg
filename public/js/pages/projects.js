document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
});

async function loadProjects() {
    try {
        const response = await fetch('/services/projects');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const projects = await response.json();
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';

        // Group projects by category
        const groupedProjects = projects.reduce((acc, project) => {
            if (!acc[project.category]) {
                acc[project.category] = [];
            }
            acc[project.category].push(project);
            return acc;
        }, {});

        // Create sections for each category
        Object.entries(groupedProjects).forEach(([category, categoryProjects]) => {
            const section = document.createElement('div');
            section.className = 'category-section';
            
            // Capitalize category name
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            section.innerHTML = `
                <h2>${categoryName}</h2>
                <div class="projects-row">
                    ${categoryProjects.map(project => `
                        <div class="card project-card ${project.featured ? 'featured' : ''}" data-category="${project.category}">
                            ${project.image_url ? `<img src="${project.image_url}" alt="${project.title}">` : ''}
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                            <div class="project-links">
                                ${project.project_url ? `<button class="project-card-button" data-url="${project.project_url}">${project.project_text || 'View Project'}</button>` : ''}
                                ${project.repo_url ? `<button class="project-card-button" data-url="${project.repo_url}">${project.repo_text || 'View Repository'}</button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            grid.appendChild(section);

            const buttons = section.querySelectorAll('.project-card-button');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const url = button.getAttribute('data-url');
                    if (url) {
                        window.open(url, '_blank');
                    }
                });
            });
        });
    } catch (err) {
        console.error('Failed to load projects:', err);
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '<div class="error-message">Failed to load projects. Please try again later.</div>';
    }
}