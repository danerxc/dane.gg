import projectService from '../services/projects.js';

export default class ProjectsController {
    // =================
    // PUBLIC ROUTES 
    // =================
    
    async getAllProjects(req, res) {
        try {
            const projects = await projectService.getAllProjects();
            res.json(projects);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getProjectsByCategory(req, res) {
        try {
            const projects = await projectService.getProjectsByCategory(req.params.categoryId);
            res.json(projects);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getFeaturedProjects(req, res) {
        try {
            const projects = await projectService.getFeaturedProjects();
            res.json(projects);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // =================
    // PROTECTED MANAGEMENT ROUTES
    // =================

    async getAllProjectsAdmin(req, res) {
        try {
            const projects = await projectService.getAllProjectsAdmin();
            res.json(projects);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async createProject(req, res) {
        try {
            const project = await projectService.createProject(req.body);
            res.status(201).json(project);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateProject(req, res) {
        try {
            const project = await projectService.updateProject(req.params.id, req.body);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            res.json(project);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteProject(req, res) {
        try {
            const success = await projectService.deleteProject(req.params.id);
            if (!success) {
                return res.status(404).json({ error: 'Project not found' });
            }
            res.json({ message: 'Project deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateProjectOrder(req, res) {
        try {
            await projectService.updateProjectOrder(req.params.id, req.body.newOrder);
            res.json({ message: 'Project order updated successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateProjectCategoryAndOrder(req, res) {
        try {
          await projectService.updateProjectCategoryAndOrder(req.params.id, req.body);
          res.json({ message: 'Project category and order updated successfully' });
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      }

    // CATEGORY MANAGEMENT
    async getCategories(req, res) {
        try {
            const categories = await projectService.getCategories();
            res.json(categories);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async createCategory(req, res) {
        try {
            const category = await projectService.createCategory(req.body.name);
            res.status(201).json(category);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateCategory(req, res) {
        try {
            const category = await projectService.updateCategory(req.params.id, req.body.name);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json(category);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteCategory(req, res) {
        try {
            const success = await projectService.deleteCategory(req.params.id);
            if (!success) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json({ message: 'Category deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // TAGS MANAGEMENT
    async getTags(req, res) {
        try {
            const tags = await projectService.getAllTags();
            res.json(tags);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async createTag(req, res) {
        try {
            const tag = await projectService.createTag(req.body);
            res.status(201).json(tag);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateTag(req, res) {
        try {
            const tag = await projectService.updateTag(req.params.id, req.body);
            if (!tag) {
                return res.status(404).json({ error: 'Tag not found' });
            }
            res.json(tag);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteTag(req, res) {
        try {
            const success = await projectService.deleteTag(req.params.id);
            if (!success) {
                return res.status(404).json({ error: 'Tag not found' });
            }
            res.json({ message: 'Tag deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // PROJECT TAG MANAGEMENT
    async assignTagsToProject(req, res) {
        try {
            const result = await projectService.assignTagsToProject(req.params.projectId, req.body.tagIds);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async removeTagFromProject(req, res) {
        try {
            const success = await projectService.removeTagFromProject(req.params.projectId, req.params.tagId);
            if (!success) {
                return res.status(404).json({ error: 'Project or tag not found' });
            }
            res.json({ message: 'Tag removed from project successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}