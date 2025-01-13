document.addEventListener('DOMContentLoaded', () => {
    initializeProjects();
});

async function initializeProjects() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    const mainContainer = document.querySelector('.container');
    const oneko = document.querySelector('#oneko');

    if (!loadingOverlay || !mainContainer) {
        console.error('Required DOM elements not found');
        return;
    }

    try {
        // Load initial data
        await loadProjects();

        // Hide loading overlay and show content
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

async function loadProjects() {
    try {
        const [projectsResponse, categoriesResponse] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/projects/categories')
        ]);

        if (!projectsResponse.ok || !categoriesResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const projects = await projectsResponse.json();
        const categories = await categoriesResponse.json();

        if (projects.length === 0) {
            const projectsGrid = document.querySelector('.projects-grid');
            projectsGrid.innerHTML = '<h2>There are currently no projects</h2>';
            return;
        }

        const categoryMap = categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {});

        const categoryOrder = ['development', 'graphics', 'design'];

        const categoriesWithPages = new Set(['development', 'graphics', 'design']);

        const groupedProjects = projects.reduce((acc, project) => {
            if (project.featured) {
                if (!acc[project.category_id]) {
                    acc[project.category_id] = [];
                }
                acc[project.category_id].push(project);
            }
            return acc;
        }, {});

        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';

        const sortedCategories = Object.keys(groupedProjects).sort((a, b) => {
            const nameA = categoryMap[a]?.toLowerCase() || '';
            const nameB = categoryMap[b]?.toLowerCase() || '';
            const indexA = categoryOrder.indexOf(nameA);
            const indexB = categoryOrder.indexOf(nameB);

            if (indexA === -1 && indexB === -1) return nameA.localeCompare(nameB);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        for (const [index, categoryId] of sortedCategories.entries()) {
            const categoryProjects = groupedProjects[categoryId];
            if (categoryProjects.length > 0) {
                const section = document.createElement('div');
                section.className = 'category-section';

                const categoryName = categoryMap[categoryId] || 'Uncategorized';
                const categoryNameLower = categoryName.toLowerCase();
                const categoryNameCapitalized = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

                const categoryHasPage = categoriesWithPages.has(categoryNameLower);

                section.innerHTML = `
                    <div class="category-header heading-underline">
                        <h2>${categoryNameCapitalized}</h2>
                        ${categoryHasPage ? `<a href="/projects/${categoryNameLower}" class="view-all-link">View All</a>` : ''}
                    </div>
                    <div class="projects-row">
                        ${categoryProjects.map(project => `
                            <div class="card project-card ${project.featured ? 'featured' : ''}" data-category="${categoryId}">
                                ${project.image_url ? `<img src="${project.image_url}" alt="${project.title}">` : ''}
                                <h3>${project.title}</h3>
                                <div class="project-tags">
                                    ${project.tags ? project.tags.map(tag => `
                                        <span class="project-tag" style="background-color: ${tag.color};">${tag.title}</span>
                                    `).join('') : ''}
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

                grid.appendChild(section);

                if (index < sortedCategories.length - 1) {
                    const divider = document.createElement('hr');
                    grid.appendChild(divider);
                }
            }
        }

        document.querySelectorAll('.project-card-button').forEach(button => {
            button.addEventListener('click', () => {
                const url = button.getAttribute('data-url');
                if (url) window.open(url, '_blank');
            });
        });

    } catch (error) {
        console.error('Error loading projects:', error);
    }
}