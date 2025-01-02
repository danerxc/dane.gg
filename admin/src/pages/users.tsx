import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  password?: string;
  changePassword?: boolean;
  totp_enabled: boolean;
}

export const Users = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data } = await axiosInstance.get('/auth/account/me');
        if (!data.is_admin) {
          navigate('/admin');
        }
      } catch (err) {
        navigate('/admin');
        throw err;
      }
    };
    checkAdmin();
  }, [navigate]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleResetTOTP = async (userId: number) => {
    try {
      await axiosInstance.post(`/auth/account/${userId}/reset-2fa`);
      await fetchUsers();
      setCurrentUser(prev => ({ ...prev, totp_enabled: false }));
      setSuccess('2FA has been reset');
    } catch (err) {
      setError('Failed to reset 2FA');
      throw err;
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

      {success && (
      <Alert 
        severity="success" 
        sx={{ mb: 2 }}
        onClose={() => setSuccess(null)}
      >
        {success}
      </Alert>
    )}

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
            value={currentUser.username ?? ''}
            onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
            margin="normal"
          />
          {isEditing ? (
            <>
              <FormControlLabel
                control={
                  <Switch
                    onChange={(e) => setCurrentUser({
                      ...currentUser,
                      changePassword: e.target.checked,
                      password: e.target.checked ? currentUser.password : undefined
                    })}
                  />
                }
                label="Change Password"
                sx={{ mt: 1 }}
              />
              {currentUser.changePassword && (
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={currentUser.password ?? ''}
                  onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                  margin="normal"
                />
              )}
            </>
          ) : (
            <TextField
              fullWidth
              label="Password"
              type="password"
              required
              value={currentUser.password ?? ''}
              onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
              margin="normal"
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={currentUser.is_admin ?? false}
                onChange={(e) => setCurrentUser({ ...currentUser, is_admin: e.target.checked })}
              />
            }
            label="Admin Access"
          />
          {isEditing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Two-Factor Authentication Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>
                  {currentUser.totp_enabled ?
                    '2FA is enabled for this user' :
                    '2FA is not enabled'}
                </Typography>
                {currentUser.totp_enabled && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleResetTOTP(currentUser.id!)}
                  >
                    Reset 2FA
                  </Button>
                )}
              </Box>
            </Box>
          )}
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