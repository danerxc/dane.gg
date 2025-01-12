import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Alert } from '@mui/material';
import { auth } from '../services/auth';

const ASCII_ART = [
    "⠀⠀⠀⠀⣠⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣄⠀⠀⠀⠀⠀⠀",
    "⠀⠀⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀",
    "⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀",
    "⠀⣾⣿⣿⣿⡏⣿⡏⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀",
    "⢸⣿⣿⣿⣼⡇⢹⣧⠽⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠀⠀",
    "⢠⣿⣿⢿⡷⡇⢁⢽⣦⣽⣯⣿⣿⣿⣿⠻⣿⣿⣿⣿⣿⣿⣿⡄⠀",
    "⢸⣿⣿⣿⣇⠘⠀⠋⠀⠿⠋⠜⣿⣿⣿⣨⣿⣿⣿⣿⣿⣿⣿⣿⠀",
    "⡌⣿⣿⡆⠋⠁⡄⠀⠀⠀⠀⠈⣿⣿⣿⣽⣿⣿⣿⣿⣿⣿⣿⣿⠃",
    "⡇⣿⣿⣯⠃⠘⠁⠀⠀⠀⢰⢶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡏⠆",
    "⢀⢿⣿⣿⣆⠀⢠⠤⠀⠀⠀⢀⣸⣿⡿⣿⣿⣿⣿⣿⡻⠋⠈⠀⠀",
    "⠘⣸⡟⣿⣿⡗⢌⠁⠀⠀⡀⠼⣿⣿⠇⣿⢿⡟⢣⢻⠓⣄⢀⠠⠂",
    "⠀⠈⢧⠹⣿⡇⠘⢱⠈⠁⠁⢸⣿⢿⢦⡤⠉⠀⢂⠂⣴⠟⣅⡀⠄",
    "⠀⠀⡸⠗⠙⠊⠀⣀⣹⠉⠒⠛⢡⡏⠃⣆⠀⠀⡇⠐⠁⡈⢆⣣⠀",
    "⠀⡎⠀⠀⠀⠀⠀⠈⠓⠃⠀⠀⣌⢃⠀⠋⡕⡚⠀⠀⠀⠀⠀⠀⡵"
  ];
  
  const AsciiArt = () => {
    const [visibleLines, setVisibleLines] = useState<number[]>([]);

    useEffect(() => {
        ASCII_ART.forEach((_, index) => {
            setTimeout(() => {
                setVisibleLines(prev => [...prev, index]);
            }, index * 100);
        });
    }, []);

    return (
        <Box sx={{ 
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            textAlign: 'center',
            mb: 3,
            '@keyframes rainbow': {
                '0%': { color: '#ff9aa2' },  // Soft pink
                '20%': { color: '#ffdac1' }, // Soft peach
                '40%': { color: '#e2f0cb' }, // Soft green
                '60%': { color: '#b5ead7' }, // Soft mint
                '80%': { color: '#c7ceea' }, // Soft blue
                '100%': { color: '#ff9aa2' } // Back to soft pink
            }
        }}>
            {ASCII_ART.map((line, index) => (
                <Typography
                    key={`ascii-line-${line}-${index}`}
                    component="div"
                    sx={{
                        opacity: visibleLines.includes(index) ? 1 : 0,
                        transition: 'opacity 0.4s ease-in-out',
                        fontSize: '10px',
                        lineHeight: 1,
                        animation: 'rainbow 8s ease-in-out infinite',
                        animationDelay: `${index * 0.1}s`
                    }}
                >
                    {line}
                </Typography>
            ))}
        </Box>
    );
};

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [totpToken, setTotpToken] = useState('');
    const [requires2FA, setRequires2FA] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const success = await auth.login(username, password, requires2FA ? totpToken : undefined);
            if (!success) {
                setRequires2FA(true);
                return;
            }
            navigate('/admin');
        } catch (err) {
            setError(requires2FA ? 'Invalid 2FA code' : 'Invalid credentials');
            throw err;
        }
    };

    return (
        <Box sx={{ 
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default'
        }}>
            <Container maxWidth="xs">
                <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 3,
                    borderRadius: 1
                }}>
                    <AsciiArt />

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ width: '100%', mb: 2 }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box 
                        component="form" 
                        onSubmit={handleSubmit} 
                        sx={{ width: '100%' }}
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={requires2FA}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={requires2FA}
                        />
                        {requires2FA && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="2FA Code"
                                value={totpToken}
                                onChange={(e) => setTotpToken(e.target.value)}
                                autoFocus
                            />
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3 }}
                        >
                            {requires2FA ? 'Verify' : 'Sign In'}
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};