import { useState, useEffect, ChangeEvent } from 'react';
import axiosInstance from '../services/axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Grid, IconButton, Dialog, DialogTitle, DialogContent, TextField,
  FormControlLabel, Switch, Button, Typography, DialogActions, Box, CircularProgress,
  Alert, LinearProgress, useTheme, useMediaQuery, Drawer
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MdEditor from 'react-markdown-editor-lite';
import { marked } from 'marked';
import 'react-markdown-editor-lite/lib/index.css';
import { useFileUpload } from '../hooks/upload';
import { ImagePreview } from '../components/imagePreview';

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  thumbnail?: string;
  published: boolean;
}

export const BlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadProgress, uploadComplete, fileInputRef, handleFileUpload, resetUploadState } = useFileUpload();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get('/api/blog/posts');
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch posts');
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    resetUploadState();
  }, [open, resetUploadState]);

  const handleCreate = () => {
    setCurrentPost({});
    setIsEditing(false);
    setOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setCurrentPost(post);
    setIsEditing(true);
    setOpen(true);
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPost(prev => {
      if (name === 'title') {
        const slug = prev.slug && prev.slug !== generateSlug(prev.title || '') ? prev.slug : generateSlug(value);
        return {
          ...prev,
          [name]: value,
          slug
        };
      }
      if (name === 'slug') {
        return {
          ...prev,
          [name]: value.replace(/\s+/g, '-')
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleDelete = async (slug: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        setError(null);
        await axiosInstance.delete(`/api/blog/posts/${slug}`);
        await fetchPosts();
      } catch (err) {
        setError('Failed to delete post');
        console.error('Failed to delete post:', err);
      }
    }
  };

  const handleEditorChange = ({ text }: { text: string }) => {
    setCurrentPost(prev => ({
      ...prev,
      content: text
    }));
  };

  const handleThumbnailChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const filePath = await handleFileUpload(e);
    if (filePath) {
      setCurrentPost(prev => ({ ...prev, thumbnail: filePath }));
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axiosInstance.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const encodedPath = encodeURI(data.filePath);
      console.log('Image uploaded:', encodedPath);
      return encodedPath;
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Failed to upload image');
      return '';
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      const postData = { ...currentPost };
      if (isEditing) {
        await axiosInstance.put(`/api/blog/posts/${currentPost.slug}`, postData);
      } else {
        await axiosInstance.post('/api/blog/posts', postData);
      }
      setOpen(false);
      await fetchPosts();
    } catch (err) {
      setError('Failed to save post');
      console.error('Failed to save post:', err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Button variant="contained" onClick={handleCreate}>
            Create New Post
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TableContainer
            component={Paper}
            sx={{
              width: '100%',
              overflowX: 'auto',
              mb: 2
            }}
          >
            <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Slug</TableCell>
                  <TableCell sx={{ width: { xs: '80px', sm: '120px' } }}>Published</TableCell>
                  <TableCell sx={{ width: { xs: '100px', sm: '120px' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>{post.title}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{post.slug}</TableCell>
                    <TableCell align="center">
                      {post.published ? (
                        <CheckCircleIcon color="success" sx={{ fontSize: '1.2rem' }} />
                      ) : (
                        <CancelIcon color="error" sx={{ fontSize: '1.2rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(post)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(post.id!)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

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
            {/* Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6">
                {isEditing ? 'Edit Post' : 'Create Post'}
              </Typography>
              <IconButton onClick={() => setOpen(false)}>
                <CancelIcon />
              </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <Grid container spacing={2}>
                {/* Title Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    name="title"
                    value={currentPost.title ?? ''}
                    onChange={handleInputChange}
                  />
                </Grid>

                {/* Slug Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Slug"
                    name="slug"
                    value={currentPost.slug ?? ''}
                    onChange={handleInputChange}
                  />
                </Grid>

                {/* Thumbnail Upload Section */}
                <Grid item xs={12}>
                  <Box display="flex" gap={2} flexDirection="column">
                    <Box display="flex" gap={1} alignItems="center">
                      <TextField
                        fullWidth
                        label="Image URL/Path"
                        value={currentPost.thumbnail || ''}
                        onChange={(e) => setCurrentPost({ ...currentPost, thumbnail: e.target.value })}
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
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="caption" color="textSecondary">
                          {uploadComplete ? 'Upload complete!' : `Uploading: ${uploadProgress}%`}
                        </Typography>
                      </Box>
                    )}
                    <ImagePreview src={currentPost.thumbnail} />
                  </Box>
                </Grid>

                {/* Editor Section */}
                <Grid item xs={12}>
                  <MdEditor
                    value={currentPost.content ?? ''}
                    style={{ height: '500px' }}
                    renderHTML={(text) => marked(text)}
                    onChange={handleEditorChange}
                    onImageUpload={handleImageUpload}
                  />
                </Grid>

                {/* Published Switch */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentPost.published ?? false}
                        onChange={(e) => setCurrentPost(prev => ({
                          ...prev,
                          published: e.target.checked
                        }))}
                      />
                    }
                    label="Published"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Footer */}
            <Box sx={{ 
              p: 2, 
              borderTop: 1, 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
              bgcolor: 'background.paper',
            }}>
              <Button onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} variant="contained" color="primary">
                Save
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Grid>
    </Box>
  );
};

export default BlogPosts;