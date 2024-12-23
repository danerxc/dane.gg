import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography,
  DialogActions,
  Button
} from '@mui/material';
import { auth } from '../services/auth';
import { useNavigate } from 'react-router-dom';

interface DecodedToken {
  exp: number;
  id: string;
  isAdmin: boolean;
}

export const TokenExpirationChecker: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [dialogVisible, setDialogVisible] = useState(true);
  const navigate = useNavigate();

  const checkTokenExpiration = () => {
    const token = auth.getToken();
    if (!token) return;

    const decoded = jwtDecode<DecodedToken>(token);
    const timeUntilExpiry = decoded.exp * 1000 - Date.now();
    
    if (timeUntilExpiry < 60000 && timeUntilExpiry > 0) {
      setOpen(true);
      setTimeLeft(Math.floor(timeUntilExpiry / 1000));
    }
    
    if (timeUntilExpiry <= 0) {
      auth.logout();
      navigate('/admin/login');
    }
  };

  useEffect(() => {
    const interval = setInterval(checkTokenExpiration, 1000);
    checkTokenExpiration();
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <Dialog 
      open={open && dialogVisible} 
      onClose={() => setDialogVisible(false)}
    >
      <DialogTitle>Session Expiring Soon</DialogTitle>
      <DialogContent>
        <Typography>
          Your session will expire in {Math.floor(timeLeft)} seconds. 
          Please save any work and prepare to log in again.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogVisible(false)}>
          Dismiss
        </Button>
        <Button 
          onClick={() => {
            auth.logout();
            navigate('/admin/login');
          }}
          color="error"
          variant="contained"
        >
          Logout Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};