import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

interface ProjectTag {
  title: string;
  color: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  project_url?: string;
  repo_url?: string;
  tags: ProjectTag[];
  featured: boolean;
}

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [isEditing, setIsEditing] = useState(false);

  const fetchProjects = async () => {
    const { data } = await axios.get('/api/projects');
    setProjects(data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSave = async () => {
    if (isEditing) {
      await axios.put(`/api/projects/${currentProject.id}`, currentProject);
    } else {
      await axios.post('/api/projects', currentProject);
    }
    setOpen(false);
    fetchProjects();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await axios.delete(`/api/projects/${id}`);
      fetchProjects();
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        onClick={() => {
          setCurrentProject({});
          setIsEditing(false);
          setOpen(true);
        }}
        sx={{ mb: 2 }}
      >
        Create New Project
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.title}</TableCell>
                <TableCell>{project.category}</TableCell>
                <TableCell>{project.featured ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  {project.tags.map((tag) => (
                    <Chip
                      key={tag.title}
                      label={tag.title}
                      size="small"
                      style={{ backgroundColor: tag.color, margin: '2px' }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => {
                      setCurrentProject(project);
                      setIsEditing(true);
                      setOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(project.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Project' : 'Create Project'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={currentProject.title || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={currentProject.description || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Category"
            value={currentProject.category || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, category: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Image URL"
            value={currentProject.image_url || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, image_url: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Project URL"
            value={currentProject.project_url || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, project_url: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Repository URL"
            value={currentProject.repo_url || ''}
            onChange={(e) => setCurrentProject({ ...currentProject, repo_url: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};