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

        // Get an array of the category names
        const categories = Object.keys(groupedProjects);

        // Loop through the categories with index
        categories.forEach((category, index) => {
            const categoryProjects = groupedProjects[category];

            const section = document.createElement('div');
            section.className = 'category-section';

            // Capitalize category name
            const categoryNameCapitalized = category.charAt(0).toUpperCase() + category.slice(1);

            // Encode the category name for URL
            const categoryURL = encodeURIComponent(category);

            // Create the category header with "View All" link
            section.innerHTML = `
                <div class="category-header">
                    <h2>${categoryNameCapitalized}</h2>
                    <a href="/projects/${categoryURL}" class="view-all-link">View All</a>
                </div>
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

            // Add event listeners to buttons
            const buttons = section.querySelectorAll('.project-card-button');
            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const url = button.getAttribute('data-url');
                    if (url) {
                        window.open(url, '_blank');
                    }
                });
            });

            // Add a divider after each category except the last one
            if (index < categories.length - 1) {
                const divider = document.createElement('hr');
                divider.className = 'category-divider';
                grid.appendChild(divider);
            }
        });
    } catch (err) {
        console.error('Failed to load projects:', err);
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '<div class="error-message">Failed to load projects. Please try again later.</div>';
    }
}