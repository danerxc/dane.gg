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
  Divider,
  Popper,
  ClickAwayListener,
  LinearProgress,
  useTheme, useMediaQuery, Drawer
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ColorLens as ColorLensIcon,
  CloudUpload as CloudUploadIcon,
  DragHandle as DragHandleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import { useState, useEffect, ChangeEvent } from 'react';
import axiosInstance from '../services/axios';
import { useFileUpload } from '../hooks/upload';
import { ImagePreview } from '../components/imagePreview';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import MdEditor from 'react-markdown-editor-lite';
import { marked } from 'marked';
import 'react-markdown-editor-lite/lib/index.css';

const TOOLBAR_OPTIONS: string[] = [
  'font-bold',
  'font-italic',
  'font-underline',
  'font-strikethrough',
  'list-unordered',
  'list-ordered',
  'link',
  'clear',
  'logger',
  'mode-toggle',
  'full-screen',
  'tab-insert'
];

const PROJECT_TEXT_OPTIONS = [
  'View Project',
  'View Website',
  'Visit Website',
  'View Demo',
  'View App',
  'View Snippet',
  'Listen Now',
  'Watch Now',
];

const REPO_TEXT_OPTIONS = [
  'View Source',
  'View Code',
  'View Repository',
  'View on GitHub',
  'View on GitLab',
  'View on Bitbucket'
];

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
  category_id?: string;
  category?: Category;
  image_url?: string;
  project_url?: string;
  repo_url?: string;
  tagIds?: string[];
  featured: boolean;
  tags?: Array<{
    id: string;
    title: string;
    color: string;
  }>;
  project_text?: typeof PROJECT_TEXT_OPTIONS[number];
  repo_text?: typeof REPO_TEXT_OPTIONS[number];
  display_order: number;
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
  const [inlineEditingTagId, setInlineEditingTagId] = useState<string | null>(null);
  const [inlineEditTag, setInlineEditTag] = useState({ title: '', color: '' });
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const { uploadProgress, uploadComplete, fileInputRef, handleFileUpload, resetUploadState } = useFileUpload();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get('/api/projects/admin');
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to fetch projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axiosInstance.get('/api/projects/categories');
      setCategories(Array.isArray(data) ? data : []);
      setCategoryOrder(data.map((cat: Category) => cat.name));
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

  const groupProjectsByCategory = (projects: Project[]) => {
    const grouped = projects.reduce((acc, project) => {
      const category = categories.find(c => c.id === project.category_id);
      const categoryName = category?.name ?? 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(project);
      return acc;
    }, {} as Record<string, Project[]>);

    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.display_order - b.display_order);
    });

    return grouped;
  };

  useEffect(() => {
    if (!isUpdatingOrder) {
      fetchProjects();
      fetchCategories();
      fetchTags();
    }
  }, [isUpdatingOrder]);

  useEffect(() => {
    resetUploadState();
  }, [open, resetUploadState]);

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

  const handleEditCategory = async () => {
    if (!editingCategoryId || !editedCategoryName) return;

    try {
      await axiosInstance.put(`/api/projects/category/${editingCategoryId}`, {
        name: editedCategoryName
      });

      await fetchCategories();
      setEditingCategoryId(null);
      setEditedCategoryName('');
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleEditorChange = ({ text }: { text: string }) => {
    setCurrentProject(prev => ({
      ...prev,
      description: text
    }));
  };

  const handleThumbnailChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const filePath = await handleFileUpload(e);
    if (filePath) {
      setCurrentProject(prev => ({ ...prev, image_url: filePath }));
    }
  };

  const handleColorPickerClick = (event: React.MouseEvent<HTMLElement>, tagId?: string) => {
    setAnchorEl(event.currentTarget);
    setColorPickerOpen(true);
    if (tagId) {
      setInlineEditingTagId(tagId);
    }
  };

  const handleUpdateTag = async (tag: Tag) => {
    try {
      await axiosInstance.put(`/api/projects/tags/${tag.id}`, {
        title: tag.title,
        color: tag.color
      });
      setTags(tags.map(t => t.id === tag.id ? tag : t));
      setFeedback({
        message: 'Tag updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update tag:', error);
      setFeedback({
        message: 'Failed to update tag',
        severity: 'error'
      });
    }
  };

  const handleTagSave = async (tagId: string) => {
    try {
      await handleUpdateTag({
        id: tagId,
        ...inlineEditTag
      });
      setInlineEditingTagId(null);
      setColorPickerOpen(false);
      setAnchorEl(null);
    } catch (error) {
      console.error('Failed to update tag:', error);
    }
  };

  const handleNewTagSave = async () => {
    try {
      const response = await axiosInstance.post('/api/projects/tags', newTag);
      setTags([...tags, response.data]);
      setNewTag({ title: '', color: '#000000' });
      setColorPickerOpen(false);
      setAnchorEl(null);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const projectId = result.draggableId;

    const sourceCategoryName = result.source.droppableId.replace('category-', '');
    const destinationCategoryName = result.destination.droppableId.replace('category-', '');

    const originalState = [...projects];
    setIsUpdatingOrder(true);

    try {
      const destinationCategory = categories.find(c => c.name === destinationCategoryName);

      if (!destinationCategory) return;

      if (sourceCategoryName === destinationCategoryName) {
        const response = await axiosInstance.put(`/api/projects/${projectId}/order`, {
          newOrder: destinationIndex
        });

        if (response.status === 200) {
          setProjects(prevProjects => {
            const newProjects = [...prevProjects];
            const categoryProjects = newProjects.filter(
              p => p.category_id === destinationCategory.id
            );

            const [movedProject] = categoryProjects.splice(sourceIndex, 1);
            categoryProjects.splice(destinationIndex, 0, movedProject);

            categoryProjects.forEach((project, index) => {
              project.display_order = index;
            });

            return newProjects.map(p => {
              const updatedProject = categoryProjects.find(cp => cp.id === p.id);
              return updatedProject || p;
            });
          });
        }
      } else {
        const response = await axiosInstance.put(`/api/projects/${projectId}/category-order`, {
          categoryId: destinationCategory.id,
          newOrder: destinationIndex
        });

        if (response.status === 200) {
          setProjects(prevProjects => {
            const newProjects = [...prevProjects];

            const projectIndex = newProjects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
              newProjects[projectIndex] = {
                ...newProjects[projectIndex],
                category_id: destinationCategory.id,
                display_order: destinationIndex
              };

              newProjects
                .filter(p => p.category_id === destinationCategory.id && p.id !== projectId)
                .forEach(p => {
                  if (p.display_order >= destinationIndex) {
                    p.display_order += 1;
                  }
                });
            }

            return newProjects;
          });
        }
      }

    } catch (error) {
      console.error('Failed to update project order:', error);
      setProjects(originalState);
    } finally {
      await fetchProjects();
      setIsUpdatingOrder(false);
    }
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

      <DragDropContext onDragEnd={handleDragEnd}>
        {categoryOrder.map((categoryName) => {
          const categoryProjects = groupProjectsByCategory(projects)[categoryName];
          if (!categoryProjects?.length) return null;

          return (
            <Box key={categoryName} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, pl: 2 }}>
                {categoryName}
              </Typography>
              <Droppable droppableId={`category-${categoryName}`}>
                {(provided) => (
                  <TableContainer
                    component={Paper}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell width="40px"></TableCell>
                          <TableCell>Title</TableCell>
                          <TableCell>Featured</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Tags</TableCell>
                          <TableCell sx={{ width: 120 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categoryProjects.map((project, index) => (
                          <Draggable
                            key={project.id}
                            draggableId={project.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                sx={{
                                  bgcolor: snapshot.isDragging ? 'action.hover' : 'inherit',
                                  '& td': { borderBottom: snapshot.isDragging ? 'none' : 'inherit' }
                                }}
                              >
                                <TableCell {...provided.dragHandleProps}>
                                  <DragHandleIcon sx={{ color: 'action.active' }} />
                                </TableCell>
                                <TableCell>{project.title}</TableCell>
                                <TableCell>
                                  {project.featured ?
                                    <CheckCircleIcon color="success" sx={{ fontSize: '1.2rem' }} /> :
                                    <CancelIcon color="error" sx={{ fontSize: '1.2rem' }} />
                                  }
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {project.tags?.map((tag) => (
                                      <Chip
                                        key={tag.id}
                                        label={tag.title}
                                        size="small"
                                        sx={{
                                          backgroundColor: tag.color,
                                          color: theme => theme.palette.getContrastText(tag.color)
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setCurrentProject({
                                        ...project,
                                        tagIds: project.tags?.map(tag => tag.id)
                                      });
                                      setIsEditing(true);
                                      setOpen(true);
                                    }}
                                    sx={{ mr: 1 }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(project.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Droppable>
            </Box>
          );
        })}
      </DragDropContext>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : '50%',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Scrollable Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3, pt: 4 }}>
            {/* Basic Info Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Basic Information</Typography>
              <Grid container spacing={3}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={currentProject.title ?? ''}
                    onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                  />
                </Grid>

                <Grid size={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={currentProject.category_id ?? ''}
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

                <Grid size={12}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Description</Typography>
                  <MdEditor
                    value={currentProject.description ?? ''}
                    style={{ height: '300px' }}
                    renderHTML={(text) => marked.parse(text)}
                    onChange={handleEditorChange}
                    plugins={TOOLBAR_OPTIONS}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Image Upload Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Project Image</Typography>
              <Box display="flex" gap={2} flexDirection="column">
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    fullWidth
                    label="Image URL/Path"
                    value={currentProject.image_url ?? ''}
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
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      height: '56px',
                      width: '56px',
                      minWidth: '56px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CloudUploadIcon />
                  </Button>
                </Box>
                {uploadProgress > 0 && (
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="caption" color="textSecondary">
                      {uploadComplete ? 'Upload complete!' : `Uploading: ${uploadProgress}%`}
                    </Typography>
                  </Box>
                )}
                <ImagePreview src={currentProject.image_url} />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* URLs & Text Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Links & Details</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Project URL"
                    value={currentProject.project_url ?? ''}
                    onChange={(e) => setCurrentProject({ ...currentProject, project_url: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Project Text</InputLabel>
                    <Select
                      value={currentProject.project_text ?? ''}
                      onChange={(e) => setCurrentProject({ ...currentProject, project_text: e.target.value })}
                      label="Project Text"
                    >
                      {PROJECT_TEXT_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Repository URL"
                    value={currentProject.repo_url ?? ''}
                    onChange={(e) => setCurrentProject({ ...currentProject, repo_url: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Repository Text</InputLabel>
                    <Select
                      value={currentProject.repo_text ?? ''}
                      onChange={(e) => setCurrentProject({ ...currentProject, repo_text: e.target.value })}
                      label="Repository Text"
                    >
                      {REPO_TEXT_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Tags & Settings Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Tags</Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
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
                            {selected.map((tagId) => {
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

                <Grid size={12}>
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
              </Grid>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            bgcolor: 'background.paper'
          }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">Save</Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
        <DialogTitle>Manage Categories</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 0.5 }}>
            <TextField
              label="New Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 1 }}
            />
            <Button
              variant="outlined"
              fullWidth
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
              <ListItem
                key={category.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  pr: 1
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1, minWidth: '80px', ml: 2 }}>
                    {editingCategoryId === category.id ? (
                      <>
                        <IconButton onClick={handleEditCategory} size="small">
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setEditingCategoryId(null);
                            setEditedCategoryName('');
                          }}
                          size="small"
                        >
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditedCategoryName(category.name);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteCategory(category.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                }
              >
                <Box sx={{ flexGrow: 1, mr: 12 }}>
                  {editingCategoryId === category.id ? (
                    <TextField
                      value={editedCategoryName}
                      onChange={(e) => setEditedCategoryName(e.target.value)}
                      size="small"
                      autoFocus
                      fullWidth
                    />
                  ) : (
                    <ListItemText primary={category.name} />
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Tag Management Dialog */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)}>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent>
          {/* Add New Tag Section */}
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid size={10}>
              <TextField
                autoFocus
                size="small"
                label="New Tag Name"
                fullWidth
                value={newTag.title}
                onChange={(e) => setNewTag({ ...newTag, title: e.target.value })}
              />
            </Grid>
            <Grid size={2}>
              <IconButton
                onClick={(e) => handleColorPickerClick(e)}
                sx={{
                  bgcolor: newTag.color,
                  '&:hover': { bgcolor: newTag.color },
                  width: 40,
                  height: 40
                }}
              >
                <ColorLensIcon sx={{ color: getContrastText(newTag.color) }} />
              </IconButton>
            </Grid>
            <Grid size={12}>
              <Button
                onClick={handleNewTagSave}
                variant="outlined"
                fullWidth
                disabled={!newTag.title}
              >
                Add New Tag
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Existing Tags List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleColorPickerClick(e, tag.id)}
                      sx={{
                        bgcolor: inlineEditTag.color,
                        '&:hover': { bgcolor: inlineEditTag.color }
                      }}
                    >
                      <ColorLensIcon sx={{
                        color: getContrastText(inlineEditTag.color),
                        fontSize: '1.2rem'
                      }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleTagSave(tag.id)}
                    >
                      <CheckCircleIcon fontSize="small" color="success" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setInlineEditingTagId(null);
                        setColorPickerOpen(false);
                        setAnchorEl(null);
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

          {/* Color Picker Popper */}
          <Popper
            open={colorPickerOpen}
            anchorEl={anchorEl}
            placement="bottom-start"
            style={{ zIndex: 1500 }}
          >
            <ClickAwayListener
              onClickAway={() => {
                setColorPickerOpen(false);
                setAnchorEl(null);
              }}
            >
              <Paper elevation={8} sx={{ p: 1 }}>
                <ChromePicker
                  color={inlineEditingTagId ? inlineEditTag.color : newTag.color}
                  onChange={(color) => {
                    if (inlineEditingTagId) {
                      setInlineEditTag(prev => ({ ...prev, color: color.hex }));
                    } else {
                      setNewTag(prev => ({ ...prev, color: color.hex }));
                    }
                  }}
                  disableAlpha
                />
              </Paper>
            </ClickAwayListener>
          </Popper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};