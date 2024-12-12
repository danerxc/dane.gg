import React, { useState, useEffect, ChangeEvent } from 'react';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../services/axios';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  published: boolean;
}

export const BlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
  const [isEditing, setIsEditing] = useState(false);

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
      // Auto-generate slug from title if title field changes
      if (name === 'title' && !prev.slug) {
        return {
          ...prev,
          [name]: value,
          slug: generateSlug(value)
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (isEditing) {
        await axiosInstance.put(`/api/blog/posts/${currentPost.slug}`, currentPost);
      } else {
        await axiosInstance.post('/api/blog/posts', currentPost);
      }
      setOpen(false);
      await fetchPosts();
    } catch (err) {
      setError('Failed to save post');
      console.error('Failed to save post:', err);
    }
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
            {posts.map((post) => (
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
            ))}
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
            value={currentPost.title || ''}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            name="slug"
            label="Slug"
            value={currentPost.slug || ''}
            onChange={handleInputChange}
            helperText="URL-friendly post link"
            margin="normal"
          />
          <TextField
            fullWidth
            name="content"
            label="Content"
            multiline
            rows={10}
            value={currentPost.content || ''}
            onChange={handleInputChange}
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