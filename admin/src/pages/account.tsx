import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import axiosInstance from '../services/axios';


export const Account = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    username: ''
  });
  const [currentUsername, setCurrentUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

    useEffect(() => {
      const fetchCurrentUser = async () => {
          try {
              const response = await axiosInstance.get('/auth/account/me');
              const { username, is_admin } = response.data;
              setCurrentUsername(username);
              setIsAdmin(!!is_admin);
              setFormData(prev => ({ ...prev, username: username }));
          } catch (err) {
              setError('Failed to fetch user data');
              console.error('Failed to fetch current user:', err);
          }
      };
      fetchCurrentUser();
  }, []);

  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username || formData.username === currentUsername) {
        setIsUsernameAvailable(null);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const response = await axiosInstance.get(`/auth/account/check-username?username=${formData.username}`);
        setIsUsernameAvailable(response.data.available);
      } catch (err) {
        console.error('Failed to check username');
      }
      setIsCheckingUsername(false);
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, currentUsername]);

  const handleChangePassword = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.currentPassword) {
        setError('Current password is required');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }

      await axiosInstance.put('/auth/account/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setSuccess('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to update password');
      }
    }
  };

  const handleChangeUsername = async () => {
    try {
      setError(null);
      setSuccess(null);

      await axiosInstance.put('/auth/account/username', {
        username: formData.username
      });

      setCurrentUsername(formData.username);
      setSuccess('Username updated successfully');
    } catch (err) {
      setError('Failed to update username');
    }
  };

  const UsernameStatus = () => {
    if (isCheckingUsername) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography>Checking availability...</Typography>
        </Box>
      );
    }
    if (formData.username && formData.username !== currentUsername) {
      return isUsernameAvailable ? (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'success.main' }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          <Typography>Available!</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'error.main' }}>
          <ErrorIcon sx={{ mr: 1 }} />
          <Typography>Username is taken</Typography>
        </Box>
      );
    }
    return null;
  };

  const PasswordErrorText = ({ message }: { message: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
      <ErrorIcon sx={{ fontSize: 20, mr: 0.5 }} />
      <Typography variant="caption">{message}</Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Account Settings</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center' }}>
        {isAdmin ? (
          <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        ) : (
          <PersonIcon sx={{ fontSize: 40, color: 'text.secondary', mr: 2 }} />
        )}
        <Box>
          <Typography variant="h6" gutterBottom>Account Type</Typography>
          <Typography color={isAdmin ? 'primary' : 'text.secondary'}>
            {isAdmin ? 'Administrator Account' : 'Standard Account'}
          </Typography>
        </Box>
      </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Change Username</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Current Username: <strong>{currentUsername}</strong>
          </Typography>
          <TextField
            fullWidth
            label="New Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            margin="normal"
            error={formData.username !== currentUsername && isUsernameAvailable === false}
          />
          <UsernameStatus />
          <Button
            variant="contained"
            onClick={handleChangeUsername}
            sx={{ mt: 2 }}
            disabled={!isUsernameAvailable || formData.username === currentUsername}
          >
            Update Username
          </Button>
        </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Change Password</Typography>
        <TextField
          fullWidth
          type="password"
          label="Current Password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          margin="normal"
          error={!!error && error.includes('Current password')}
          helperText={error && error.includes('Current password') ?
            <PasswordErrorText message={error} /> : ''}
        />
        <TextField
          fullWidth
          type="password"
          label="New Password"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          margin="normal"
        />
        <TextField
          fullWidth
          type="password"
          label="Confirm New Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          margin="normal"
          error={formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword}
          helperText={
            formData.confirmPassword !== '' &&
              formData.newPassword !== formData.confirmPassword ?
              <PasswordErrorText message="Passwords do not match" /> : ''
          }
        />
        <Button
          variant="contained"
          onClick={handleChangePassword}
          sx={{ mt: 2 }}
          disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
        >
          Update Password
        </Button>
      </Paper>
    </Box>
  );
};