import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { BlogPosts } from './blog';
import { Projects } from './projects';
import { Users } from './users';
import { auth, setNavigate } from '../services/auth';
import { TokenExpirationChecker } from '../components/tokenExpirationCheck';

const drawerWidth = 240;

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  const handleLogout = () => {
    auth.logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { text: 'Blog Posts', path: '/admin/blog', icon: <MenuIcon /> },
    { text: 'Projects', path: '/admin/projects', icon: <MenuIcon /> },
    { text: 'Users', path: '/admin/users', icon: <MenuIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <TokenExpirationChecker />
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setOpen(!open)}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItemButton key={item.text} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: open ? `${drawerWidth}px` : 0,
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/blog/*" element={<BlogPosts />} />
          <Route path="/projects/*" element={<Projects />} />
          <Route path="/users/*" element={<Users />} />
          <Route path="/" element={<BlogPosts />} /> {/* Default route */}
        </Routes>
      </Box>
    </Box>
  );
};

export default Dashboard;