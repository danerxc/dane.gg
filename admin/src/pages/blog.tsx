import { useState, useEffect, ChangeEvent } from 'react';
import axiosInstance from '../services/axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, TextField,
  FormControlLabel, Switch, Button, Typography, DialogActions, Box, CircularProgress,
  Alert, LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MdEditor from 'react-markdown-editor-lite';
import { marked } from 'marked';
import 'react-markdown-editor-lite/lib/index.css';
import { useFileUpload } from '../hooks/upload';

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
      console.log('Image uploaded:', data.filePath);
      return `${data.filePath}`;
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

  const getBaseURL = () => {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Button variant="contained" onClick={handleCreate} sx={{ mb: 2 }}>
        Create New Post
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Published</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body1">No blog posts</Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>{post.slug}</TableCell>
                  <TableCell>{post.published ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(post)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(post.slug)}>
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
        <DialogTitle>{isEditing ? 'Edit Post' : 'Create Post'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            name="title"
            label="Title"
            value={currentPost.title ?? ''}
            onChange={handleInputChange}
            margin="normal"
          />
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
            <Typography variant="body1" style={{ marginRight: 8, flexShrink: 0, marginTop: 8 }}>
              {getBaseURL()}/blog/
            </Typography>
            <TextField
              fullWidth
              name="slug"
              label="Link"
              value={currentPost.slug ?? ''}
              onChange={handleInputChange}
              margin="normal"
            />
          </div>
          <MdEditor
            value={currentPost.content ?? ''}
            style={{ height: '500px' }}
            renderHTML={(text) => marked(text)}
            onChange={handleEditorChange}
            onImageUpload={async (file) => {
              const imageUrl = await handleImageUpload(file);
              return imageUrl;
            }}
          />
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

export default BlogPosts;