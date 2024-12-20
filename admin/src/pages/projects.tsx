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
  Divider,
  Popper,
  ClickAwayListener,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ColorLens as ColorLensIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
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

const getContrastText = (hexcolor: string) => {
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState({ title: '', color: '#000000' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);
  const [inlineEditingTagId, setInlineEditingTagId] = useState<string | null>(null);
  const [inlineEditTag, setInlineEditTag] = useState({ title: '', color: '' });
  const [inlineColorPickerOpen, setInlineColorPickerOpen] = useState(false);
  const [thumbnailSource, setThumbnailSource] = useState<'url' | 'upload'>('url');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayFilename, setDisplayFilename] = useState<string>('');


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

  useEffect(() => {
    fetchProjects();
    fetchCategories();
    fetchTags();
    if (currentProject?.image_url) {
      setDisplayFilename(getFilenameFromPath(currentProject.image_url));
      setThumbnailSource(currentProject.image_url.startsWith('/uploads/') ? 'upload' : 'url');
    } else {
      setDisplayFilename('');
      setThumbnailSource('url');
    }
  }, [currentProject?.image_url]);

  const handleAddTag = async () => {
    try {
      const response = await axiosInstance.post('/api/projects/tags', newTag);
      setTags([...tags, response.data]);
      setNewTag({ title: '', color: '#000000' });
    } catch (error) {
      console.error('Failed to create tag:', error);
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

  const handleDeleteTag = async (tagId: string) => {
    try {
      await axiosInstance.delete(`/api/projects/tags/${tagId}`);
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleEditCategory = async (category: Category) => {
    try {
      await axiosInstance.put(`/api/projects/category/${category.id}`, {
        name: category.name
      });
      setCategories(categories.map(c =>
        c.id === category.id ? category : c
      ));
      setEditingCategoryId(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleUpdateTag = async (tag: Tag) => {
    try {
      await axiosInstance.put(`/api/projects/tags/${tag.id}`, {
        title: tag.title,
        color: tag.color
      });
      setTags(tags.map(t => t.id === tag.id ? tag : t));
      setEditingTag(null);
      setColorPickerOpen(false);
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  const handleThumbnailChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadProgress(0);
    setUploadComplete(false);

    try {
      const { data } = await axiosInstance.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      setCurrentProject(prev => ({ ...prev, image_url: data.filePath }));
      setUploadComplete(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Failed to upload thumbnail');
      console.error('Upload error:', err);
    }
  }, [setCurrentProject, setError]);

  const getFilenameFromPath = (path: string) => {
    if (!path) return '';
    return path.split('/').pop() || '';
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {feedback && (
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback(null)}
          sx={{ mb: 2 }}
        >
          {feedback.message}
        </Alert>
      )}
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
            <Grid item xs={12}>
              <Box display="flex" gap={1} alignItems="center">
                <TextField
                  fullWidth
                  label="Image URL/Path"
                  value={currentProject.image_url || ''}
                  onChange={(e) => setCurrentProject({ ...currentProject, image_url: e.target.value })}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="contained"
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<CloudUploadIcon />}
                >
                  Upload
                </Button>
              </Box>
              {uploadProgress > 0 && (
                <Box sx={{ mt: 1, width: '100%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {uploadComplete ? 'Upload complete!' : `Uploading: ${uploadProgress}%`}
                  </Typography>
                </Box>
              )}
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
                                color: getContrastText(tag.color)
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
                            color: getContrastText(tag.color),
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
                      onClick={() => handleEditCategory({
                        id: category.id,
                        name: editedCategoryName
                      })}
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
          {!editingTag ? (
            <Grid container spacing={2}>
              <Grid item xs={10}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Tag Name"
                  fullWidth
                  value={newTag.title}
                  onChange={(e) => setNewTag({ ...newTag, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={10}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    margin="dense"
                    label="Tag Color"
                    fullWidth
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            backgroundColor: newTag.color,
                            border: '1px solid #ccc',
                            mr: 1
                          }}
                        />
                      ),
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  onClick={(e) => {
                    setColorPickerOpen(true);
                    setPickerPosition({ x: e.clientX, y: e.clientY });
                  }}
                >
                  <ColorLensIcon />
                </IconButton>
              </Grid>
              <Grid item xs={12}>
                <Button
                  onClick={handleAddTag}
                  variant="contained"
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  Add New Tag
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={10}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Edit Tag Name"
                  fullWidth
                  value={newTag.title}
                  onChange={(e) => setNewTag({ ...newTag, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={10}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    margin="dense"
                    label="Edit Tag Color"
                    fullWidth
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            backgroundColor: newTag.color,
                            border: '1px solid #ccc',
                            mr: 1
                          }}
                        />
                      ),
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  onClick={(e) => {
                    setColorPickerOpen(true);
                    setPickerPosition({ x: e.clientX, y: e.clientY });
                  }}
                >
                  <ColorLensIcon />
                </IconButton>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    onClick={() => handleUpdateTag({
                      id: editingTag.id,
                      ...newTag
                    })}
                    variant="contained"
                  >
                    Update
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingTag(null);
                      setNewTag({ title: '', color: '#000000' });
                    }}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            {tags.map((tag) => (
              <Box
                key={tag.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {inlineEditingTagId === tag.id ? (
                  <>
                    <TextField
                      size="small"
                      value={inlineEditTag.title}
                      onChange={(e) => setInlineEditTag({ ...inlineEditTag, title: e.target.value })}
                      sx={{
                        flexGrow: 1,
                        maxWidth: '50%'
                      }}
                    />
                    <TextField
                      size="small"
                      value={inlineEditTag.color}
                      onChange={(e) => setInlineEditTag({ ...inlineEditTag, color: e.target.value })}
                      sx={{ width: '120px' }}
                      InputProps={{
                        startAdornment: (
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: 1,
                              backgroundColor: inlineEditTag.color,
                              border: '1px solid #ccc',
                              mr: 1
                            }}
                          />
                        ),
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setInlineColorPickerOpen(true);
                        setPickerPosition({ x: e.clientX, y: e.clientY });
                      }}
                    >
                      <ColorLensIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        await handleUpdateTag({
                          id: tag.id,
                          ...inlineEditTag
                        });
                        setInlineEditingTagId(null);
                        setInlineEditTag({ title: '', color: '' });
                        const response = await axiosInstance.get('/api/projects/tags');
                        setTags(response.data);
                      }}
                    >
                      <CheckCircleIcon fontSize="small" color="success" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setInlineEditingTagId(null);
                        setInlineEditTag({ title: '', color: '' });
                      }}
                    >
                      <CancelIcon fontSize="small" color="error" />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <Chip
                      label={tag.title}
                      sx={{
                        flexGrow: 1,
                        backgroundColor: tag.color,
                        color: getContrastText(tag.color),
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        setInlineEditingTagId(tag.id);
                        setInlineEditTag({ title: tag.title, color: tag.color });
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Box>
            ))}
          </Box>

          {inlineColorPickerOpen && (
            <Popper
              open={inlineColorPickerOpen}
              anchorEl={null}
              style={{
                position: 'absolute',
                left: pickerPosition.x,
                top: pickerPosition.y,
                zIndex: 1500,
              }}
            >
              <ClickAwayListener onClickAway={() => setInlineColorPickerOpen(false)}>
                <div>
                  <ChromePicker
                    color={inlineEditTag.color}
                    onChange={(color) => {
                      setInlineEditTag({ ...inlineEditTag, color: color.hex });
                    }}
                  />
                </div>
              </ClickAwayListener>
            </Popper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};