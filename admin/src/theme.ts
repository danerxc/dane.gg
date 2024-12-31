import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e48f8f',
    },
    background: {
      default: '#141414',
      paper: '#141414',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#141414',
          color: '#ffffff',
        }
      }
    },
    MuiDrawer: {
      defaultProps: {
        PaperProps: {
          sx: {
            backgroundColor: '#141414 !important',
            borderRight: '1px solid #ffffff !important',
          }
        }
      },
      styleOverrides: {
        paper: {
          '& .MuiListItem-root': {
            '& .MuiListItemText-primary': {
              color: '#ffffff !important',
              transition: 'color 0.2s',
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff !important',
              transition: 'color 0.2s',
            },
            '&:hover': {
              '& .MuiListItemText-primary': {
                color: '#e48f8f !important',
              },
              '& .MuiListItemIcon-root': {
                color: '#e48f8f !important',
              },
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s !important',
        },
        outlined: {
          backgroundColor: 'transparent !important',
          color: '#ffffff !important',
          border: '1px solid #ffffff !important',
          '&:hover': {
            backgroundColor: '#e48f8f !important',
            color: '#ffffff !important',
            borderColor: '#e48f8f !important',
          }
        },
        contained: {
          backgroundColor: '#ba7373 !important',
          color: '#ffffff !important',
          border: '1px solid #e48f8f !important',
          '&:hover': {
            backgroundColor: '#e48f8f !important',
            borderColor: '#ffffff !important',
          }
        }
      }
    }
  }
});