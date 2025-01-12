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
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import { Link } from 'react-router-dom';
import { Stats } from './stats';
import { BlogPosts } from './blog';
import { Projects } from './projects';
import { Users } from './users';
import { Account } from './account';
import { auth } from '../services/auth';
import { TokenExpirationChecker } from '../components/tokenExpirationCheck';
import axiosInstance from '../services/axios';
import logo from '../assets/logo.webp';

const drawerWidth = 240;

interface User {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
  password?: string;
  changePassword?: boolean;
  totp_enabled: boolean;
}

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axiosInstance.get('/auth/account/me');
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    auth.logout();
    navigate('/admin/login');
  };

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  const mobileDrawerProps = {
    open: mobileOpen,
    onClose: handleDrawerToggle,
    ModalProps: { keepMounted: true },
    sx: {
      display: { xs: 'block', sm: 'none' },
      '& .MuiDrawer-paper': {
        boxSizing: 'border-box',
        width: drawerWidth,
        overflowX: 'hidden'
      }
    }
  };

  const mainMenuItems = [
    {
      text: 'Dashboard',
      path: '/admin',
      icon: <DashboardIcon />
    },
    {
      text: 'Blog Posts',
      path: '/admin/blog',
      icon: <CollectionsBookmarkIcon />
    },
    {
      text: 'Projects',
      path: '/admin/projects',
      icon: <HighlightAltIcon />
    },
    ...(user?.is_admin ? [{
      text: 'Users',
      path: '/admin/users',
      icon: <PeopleIcon />
    }] : [])
  ];

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();

    useEffect(() => {
      if (!user?.is_admin) {
        navigate('/admin');
      }
    }, [navigate]);

    return user?.is_admin ? <>{children}</> : null;
  };

  const accountMenuItem = {
    text: 'Account',
    path: '/admin/account',
    icon: <PersonIcon />
  };

  const DrawerContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar />
      <List>
        {mainMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              sx={{
                minHeight: 48,
                justifyContent: isMobile ? 'initial' : (desktopOpen ? 'initial' : 'center'),
                px: 2.5,
              }}
            >
              <ListItemIcon sx={{
                minWidth: 0,
                mr: isMobile ? 3 : (desktopOpen ? 3 : 'auto'),
                justifyContent: 'center',
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  opacity: isMobile ? 1 : (desktopOpen ? 1 : 0),
                  display: isMobile ? 'block' : (desktopOpen ? 'block' : 'none')
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to={accountMenuItem.path}
            sx={{
              minHeight: 48,
              justifyContent: desktopOpen ? 'initial' : 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: desktopOpen ? 3 : 'auto',
              justifyContent: 'center',
            }}>
              {accountMenuItem.icon}
            </ListItemIcon>
            <ListItemText
              primary={accountMenuItem.text}
              sx={{ opacity: desktopOpen ? 1 : 0 }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <TokenExpirationChecker />
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <img
              src={logo}
              alt="Logo"
              style={{
                height: '50px',
                marginLeft: '12px'
              }}
            />
          </Box>
          <IconButton
            color="inherit"
            onClick={handleLogout}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer variant="temporary" {...mobileDrawerProps}>
          <DrawerContent />
        </Drawer>
      ) : (
        /* Desktop Drawer */
        <Drawer
          variant="permanent"
          sx={{
            width: desktopOpen ? drawerWidth : 72,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: desktopOpen ? drawerWidth : 72,
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
            },
          }}
          open={desktopOpen}
        >
          <DrawerContent />
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: {
            xs: '100%',
            sm: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          transition: theme => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          })
        }}
      >
        <Toolbar />
        <Box
          sx={{
            width: '100%',
            maxWidth: '1200px',
          }}
        >
          <Routes>
            <Route path="/" element={<Stats />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/blog" element={<BlogPosts />} />
            <Route path="/projects" element={<Projects />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route path="/account" element={<Account />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;