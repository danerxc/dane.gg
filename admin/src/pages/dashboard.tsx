import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import { Link } from 'react-router-dom';
import { BlogPosts } from './blog';
import { Projects } from './projects';
import { Users } from './users';
import { Account } from './account';
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

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const mainMenuItems = [
    { text: 'Blog Posts', path: '/admin/blog', icon: <CollectionsBookmarkIcon /> },
    { text: 'Projects', path: '/admin/projects', icon: <HighlightAltIcon /> },
    { text: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
  ];

  const accountMenuItem = { text: 'Account', path: '/admin/account', icon: <PersonIcon /> };

  return (
    <Box sx={{ display: 'flex' }}>
      <TokenExpirationChecker />
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 56,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 56,
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List>
            {mainMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} to={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ flexGrow: 1 }} />
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} to={accountMenuItem.path}>
                <ListItemIcon>{accountMenuItem.icon}</ListItemIcon>
                <ListItemText primary={accountMenuItem.text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
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
          <Route path="/account" element={<Account />} />
          <Route path="/" element={<BlogPosts />} /> {/* Default route */}
        </Routes>
      </Box>
    </Box>
  );
};

export default Dashboard;