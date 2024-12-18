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
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../services/axios';

interface User {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User & { password: string }>>({});
  const [isEditing, setIsEditing] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get('/api/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError(null);
        await axiosInstance.delete(`/api/admin/users/${id}`);
        await fetchUsers();
      } catch (err) {
        setError('Failed to delete user');
        console.error('Failed to delete user:', err);
      }
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (isEditing) {
        await axiosInstance.put(`/api/admin/users/${currentUser.id}`, {
          username: currentUser.username,
          password: currentUser.password,
          isAdmin: currentUser.is_admin
        });
      } else {
        await axiosInstance.post('/api/admin/users', {
          username: currentUser.username,
          password: currentUser.password,
          isAdmin: currentUser.is_admin
        });
      }
      setOpen(false);
      await fetchUsers();
    } catch (err) {
      setError('Failed to save user');
      console.error('Failed to save user:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Button
        variant="contained"
        onClick={() => {
          setCurrentUser({});
          setIsEditing(false);
          setOpen(true);
        }}
        sx={{ mb: 2 }}
      >
        Create New User
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body1">No users</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.is_admin ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setCurrentUser(user);
                        setIsEditing(true);
                        setOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(user.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={currentUser.username || ''}
            onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
            margin="normal"
          />
          {!isEditing && (
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={currentUser.password || ''}
              onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
              margin="normal"
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={currentUser.is_admin || false}
                onChange={(e) => setCurrentUser({ ...currentUser, is_admin: e.target.checked })}
              />
            }
            label="Admin Access"
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