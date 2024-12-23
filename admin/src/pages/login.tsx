import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Alert } from '@mui/material';
import { auth } from '../services/auth';

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
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">Admin Login</Typography>
                {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {requires2FA ? 'Verify' : 'Sign In'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};