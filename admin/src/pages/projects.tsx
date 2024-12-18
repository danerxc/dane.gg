import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import axiosInstance from '../services/axios';

interface Tag {
  id: string;
  title: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category_id: string;
  image_url?: string;
  project_url?: string;
  project_text?: string;
  repo_url?: string;
  repo_text?: string;
  tagIds?: string[];
  featured: boolean;
  tags?: Array<{
    id: string;
    title: string;
    color: string;
  }>;
}

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState({ title: '', color: '#000000' });
  const [tagError, setTagError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editedTag, setEditedTag] = useState({ title: '', color: '' });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get('/api/projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      setError('Failed to fetch projects');
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axiosInstance.get('/api/projects/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  };

  const fetchTags = async () => {
    try {
      const { data } = await axiosInstance.get('/api/projects/tags');
      setTags(data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      setTags([]);
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategory.trim()) {
        setCategoryError('Category name is required');
        return;
      }
      await axiosInstance.post('/api/projects/category', { name: newCategory.trim() });
      await fetchCategories();

      setNewCategory('');
      setCategoryError(null);
      setCategoryDialogOpen(false);

    } catch (error) {
      console.error('Failed to create category:', error);
      setCategoryError('Failed to create category. Please try again.');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchCategories();
    fetchTags();
  }, []);

  const handleAddTag = async () => {
    try {
      if (!newTag.title.trim()) {
        setTagError('Tag name is required');
        return;
      }
      await axiosInstance.post('/api/projects/tags', newTag);
      await fetchTags();
      setNewTag({ title: '', color: '#000000' });
      setTagError(null);
      setTagDialogOpen(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
      setTagError('Failed to create tag. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (isEditing) {
        await axiosInstance.put(`/api/projects/${currentProject.id}`, currentProject);
        if (currentProject.tagIds) {
          await axiosInstance.post(`/api/projects/${currentProject.id}/tags`, {
            tagIds: currentProject.tagIds
          });
        }
      } else {
        const { data: newProject } = await axiosInstance.post('/api/projects', currentProject);
        if (currentProject.tagIds) {
          await axiosInstance.post(`/api/projects/${newProject.id}/tags`, {
            tagIds: currentProject.tagIds
          });
        }
      }
      setOpen(false);
      await fetchProjects();
    } catch (err) {
      setError('Failed to save project');
      console.error('Failed to save project:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        setError(null);
        await axiosInstance.delete(`/api/projects/${id}`);
        await fetchProjects();
      } catch (error) {
        setError('Failed to delete project');
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await axiosInstance.delete(`/api/projects/category/${categoryId}`);
      setCategories(categories.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };
  
  const handleCreateCategory = async () => {
    try {
      const response = await axiosInstance.post('/api/projects/category', { name: newCategoryName });
      setCategories([...categories, response.data]);
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Add delete handler function
  const handleDeleteTag = async (tagId: string) => {
    try {
      await axiosInstance.delete(`/api/projects/tags/${tagId}`);
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  // Add edit handler
  const handleEditCategory = async (categoryId: string) => {
    try {
      await axiosInstance.put(`/api/projects/category/${categoryId}`, { 
        name: editedCategoryName 
      });
      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, name: editedCategoryName } : cat
      ));
      setEditingCategoryId(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  // Add tag edit handler
  const handleEditTag = async (tagId: string) => {
    try {
      await axiosInstance.put(`/api/projects/tags/${tagId}`, editedTag);
      setTags(tags.map(tag => 
        tag.id === tagId ? { ...tag, ...editedTag } : tag
      ));
      setEditingTagId(null);
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

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
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1">No projects</Typography>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.title}</TableCell>
                  <TableCell>
                    {categories.find(c => c.id === project.category_id)?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell>
                    {project.featured ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                  </TableCell>
                  <TableCell>
                    {project.tags && project.tags.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {project.tags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.title}
                            size="small"
                            sx={{
                              backgroundColor: tag.color,
                              color: theme => theme.palette.getContrastText(tag.color),
                              '&:hover': {
                                backgroundColor: tag.color,
                                opacity: 0.9
                              }
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No tags
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setCurrentProject({
                          ...project,
                          tagIds: project.tags?.map(tag => tag.id) || []
                        });
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Project' : 'Create Project'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={currentProject.title || ''}
                onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={currentProject.category_id || ''}
                    onChange={(e) => setCurrentProject({ ...currentProject, category_id: e.target.value })}
                    label="Category"
                  >
                    {Array.isArray(categories) && categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton onClick={() => setCategoryDialogOpen(true)}>
                  <AddIcon />
                </IconButton>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={currentProject.description || ''}
                onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentProject.featured || false}
                    onChange={(e) => setCurrentProject({ ...currentProject, featured: e.target.checked })}
                  />
                }
                label="Featured"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Image URL"
                value={currentProject.image_url || ''}
                onChange={(e) => setCurrentProject({ ...currentProject, image_url: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Project URL"
                value={currentProject.project_url || ''}
                onChange={(e) => setCurrentProject({ ...currentProject, project_url: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Project Text"
                value={currentProject.project_text || ''}
                onChange={(e) => setCurrentProject({ ...currentProject, project_text: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Repository URL"
                value={currentProject.repo_url || ''}
                onChange={(e) => setCurrentProject({ ...currentProject, repo_url: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Repository Text"
                value={currentProject.repo_text || ''}
                onChange={(e) => setCurrentProject({ ...currentProject, repo_text: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Tags</InputLabel>
                  <Select
                    multiple
                    value={currentProject.tagIds || []}
                    onChange={(e) => setCurrentProject({
                      ...currentProject,
                      tagIds: e.target.value as string[]
                    })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((tagId) => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <Chip
                              key={tag.id}
                              label={tag.title}
                              sx={{
                                backgroundColor: tag.color,
                                color: theme => theme.palette.getContrastText(tag.color)
                              }}
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                  >
                    {tags.map((tag) => (
                      <MenuItem key={tag.id} value={tag.id}>
                        <Chip
                          size="small"
                          label={tag.title}
                          sx={{
                            backgroundColor: tag.color,
                            color: theme => theme.palette.getContrastText(tag.color),
                            mr: 1
                          }}
                        />
                        {tag.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton onClick={() => setTagDialogOpen(true)}>
                  <AddIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
        <DialogTitle>Manage Categories</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="New Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 1 }}
            />
            <Button 
              variant="contained"
              onClick={handleCreateCategory}
              disabled={!newCategoryName}
              sx={{ mt: 1 }}
            >
              Add Category
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />
          <List>
            {categories.map((category) => (
              <ListItem key={category.id}>
                {editingCategoryId === category.id ? (
                  <>
                    <TextField
                      value={editedCategoryName}
                      onChange={(e) => setEditedCategoryName(e.target.value)}
                      size="small"
                      autoFocus
                      fullWidth
                    />
                    <IconButton 
                      onClick={() => handleEditCategory(category.id)}
                      color="primary"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => setEditingCategoryId(null)}
                      color="default"
                    >
                      <CancelIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <ListItemText primary={category.name} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setEditedCategoryName(category.name);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)}>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Tag Name"
                fullWidth
                value={newTag.title}
                onChange={(e) => setNewTag({ ...newTag, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                type="color"
                margin="dense"
                label="Tag Color"
                fullWidth
                value={newTag.color}
                onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
              />
            </Grid>
          </Grid>
          <Button 
            onClick={handleAddTag} 
            variant="contained" 
            sx={{ mt: 2, mb: 2 }}
            fullWidth
          >
            Add New Tag
          </Button>
          <Divider sx={{ my: 2 }} />
          <List>
            {tags.map((tag) => (
              <ListItem key={tag.id}>
                {editingTagId === tag.id ? (
                  <>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6}>
                        <TextField
                          value={editedTag.title}
                          onChange={(e) => setEditedTag({ ...editedTag, title: e.target.value })}
                          size="small"
                          fullWidth
                          autoFocus
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          type="color"
                          value={editedTag.color}
                          onChange={(e) => setEditedTag({ ...editedTag, color: e.target.value })}
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <IconButton 
                          onClick={() => handleEditTag(tag.id)}
                          color="primary"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => setEditingTagId(null)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Chip
                      label={tag.title}
                      sx={{
                        backgroundColor: tag.color,
                        color: theme => theme.palette.getContrastText(tag.color),
                        '& .MuiChip-label': { fontSize: '0.875rem' }
                      }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditedTag({ title: tag.title, color: tag.color });
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};