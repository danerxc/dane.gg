import React, { useEffect, useState, useRef } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SendIcon from '@mui/icons-material/Send';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from '@mui/material';

export const ChatModeration = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogUser, setDialogUser] = useState<{ userUUID: string, username: string } | null>(null);
    const [newUsername, setNewUsername] = useState('');

    // Get JWT from localStorage (same as your axiosInstance)
    const getToken = () => localStorage.getItem('adminToken');

    useEffect(() => {
        wsRef.current = new window.WebSocket(
            `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/chat`
        );
        wsRef.current.onopen = () => {
            console.log('WebSocket connected');
        };
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'history') {
                setMessages(data.data.reverse());
            } else if (data.type === 'message') {
                setMessages(prev => [...prev, data.data]);
            } else if (data.type === 'message_deleted') {
                setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
            } else if (data.type === 'username_changed') {
                setMessages(prev => prev.map(msg =>
                    msg.userUUID === data.userUUID
                        ? { ...msg, username: data.newUsername }
                        : msg
                ));
            }
        };
        wsRef.current.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
        wsRef.current.onclose = () => {
            console.log('WebSocket closed');
        };
        return () => wsRef.current?.close();
    }, []);

    const sendWithAuth = (payload: any) => {
        wsRef.current?.send(JSON.stringify({
            ...payload,
            jwt: getToken(),
        }));
    };

    const deleteMessage = (id: number) => {
        sendWithAuth({ type: 'delete_message', messageId: id });
    };

    const changeUsername = (userUUID: string, newUsername: string) => {
        sendWithAuth({ type: 'change_username', userUUID, newUsername });
    };

    const sendAdminMessage = (content: string) => {
        sendWithAuth({ type: 'admin_message', content });
    };

    // For better UX, use a ref for the input and clear after send
    const adminMsgRef = useRef<HTMLInputElement>(null);

    // Dialog handlers
    const openUsernameDialog = (userUUID: string, username: string) => {
        setDialogUser({ userUUID, username });
        setNewUsername(username);
        setDialogOpen(true);
    };

    const handleDialogSave = () => {
        if (dialogUser) {
            changeUsername(dialogUser.userUUID, newUsername.trim() || 'Anonymous');
            setDialogOpen(false);
        }
    };

    const handleDialogRemove = () => {
        if (dialogUser) {
            changeUsername(dialogUser.userUUID, 'Anonymous');
            setDialogOpen(false);
        }
    };

    return (
        <div
            style={{
                padding: 16,
                width: '100%',
                maxWidth: 1200,
                margin: '32px auto',
                background: '#1a1a1a',
                borderRadius: 8,
                boxShadow: '0 2px 12px #0005',
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                height: '60vh',
                minWidth: 0,
            }}
        >
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    border: '1px solid #222',
                    borderRadius: 6,
                    background: '#181818',
                    marginBottom: 16,
                    minHeight: 0,
                }}
            >
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontFamily: 'monospace',
                    background: 'transparent',
                    color: '#fff',
                    fontSize: 14,
                }}>
                    <thead>
                        <tr style={{ background: '#232323', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '6px 8px', borderBottom: '1px solid #333', minWidth: 60 }}>Time</th>
                            <th style={{ padding: '6px 8px', borderBottom: '1px solid #333', minWidth: 80 }}>User</th>
                            <th style={{ padding: '6px 8px', borderBottom: '1px solid #333' }}>Message</th>
                            <th style={{ padding: '6px 8px', borderBottom: '1px solid #333', minWidth: 80 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.map(msg => (
                            <tr key={msg.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '4px 8px', color: '#aaa', whiteSpace: 'nowrap' }}>
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                                </td>
                                <td style={{ padding: '4px 8px', color: '#7fd6ff', wordBreak: 'break-all' }}>
                                    {msg.username}
                                </td>
                                <td style={{ padding: '4px 8px', wordBreak: 'break-word' }}>
                                    {msg.content}
                                </td>
                                <td style={{ padding: '4px 8px', whiteSpace: 'nowrap', display: 'flex', gap: 8 }}>
                                    <span
                                        style={{
                                            cursor: 'pointer',
                                            color: '#7fd6ff', // Contrasting blue/cyan to red
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                        }}
                                        title="Change username"
                                        onClick={() => openUsernameDialog(msg.userUUID, msg.username)}
                                    >
                                        <AssignmentIndIcon fontSize="small" />
                                    </span>
                                    <span
                                        style={{
                                            cursor: 'pointer',
                                            color: '#e48f8f',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                        }}
                                        title="Delete message"
                                        onClick={() => deleteMessage(msg.id)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <form
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 8,
                    flexWrap: 'wrap',
                    padding: 0,
                }}
                onSubmit={e => {
                    e.preventDefault();
                    const val = adminMsgRef.current?.value.trim();
                    if (val) {
                        sendAdminMessage(val);
                        if (adminMsgRef.current) adminMsgRef.current.value = '';
                    }
                }}
            >
                <input
                    ref={adminMsgRef}
                    type="text"
                    placeholder="Send admin message"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '10px 14px',
                        fontFamily: 'monospace',
                        background: '#232323',
                        color: '#fff',
                        border: '1.5px solid #e48f8f',
                        borderRadius: 4,
                        fontSize: 16,
                        outline: 'none',
                        transition: 'border 0.2s',
                    }}
                    onFocus={e => (e.target.style.border = '1.5px solid #e48f8f')}
                    onBlur={e => (e.target.style.border = '1.5px solid #e48f8f')}
                />
                <button
                    type="submit"
                    style={{
                        background: 'linear-gradient(90deg, #e48f8f 0%, #ba7373 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        padding: '10px 24px',
                        fontWeight: 600,
                        fontSize: 16,
                        letterSpacing: 1,
                        boxShadow: '0 2px 8px #0002',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Send as Admin"
                >
                    <SendIcon fontSize="medium" />
                </button>
            </form>

            {/* Username Change Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                PaperProps={{
                    style: {
                        background: '#181818',
                        color: '#fff',
                        borderRadius: 8,
                        minWidth: 320,
                        maxWidth: 400,
                        width: '100%',
                        border: '1.5px solid #e48f8f'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#e48f8f', fontWeight: 700, fontFamily: 'monospace' }}>
                    Change Username
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                            Set a new username for this user or remove it to revert to <b>Anonymous</b>.
                        </Typography>
                        <TextField
                            autoFocus
                            fullWidth
                            variant="outlined"
                            label="Username"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            sx={{
                                input: {
                                    color: '#fff',
                                    background: '#232323'
                                },
                                label: { color: '#e48f8f' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#e48f8f' },
                                    '&:hover fieldset': { borderColor: '#e48f8f' },
                                    '&.Mui-focused fieldset': { borderColor: '#e48f8f' }
                                }
                            }}
                            InputLabelProps={{
                                style: { color: '#e48f8f' }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={handleDialogRemove}
                        sx={{
                            borderColor: '#e48f8f',
                            color: '#e48f8f',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            '&:hover': {
                                background: '#2a1818',
                                borderColor: '#e48f8f'
                            }
                        }}
                    >
                        Remove
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            onClick={() => setDialogOpen(false)}
                            sx={{
                                color: '#fff',
                                fontFamily: 'monospace'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleDialogSave}
                            sx={{
                                background: 'linear-gradient(90deg, #e48f8f 0%, #ba7373 100%)',
                                color: '#fff',
                                fontWeight: 600,
                                fontFamily: 'monospace',
                                boxShadow: '0 2px 8px #0002',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #ba7373 0%, #e48f8f 100%)'
                                }
                            }}
                        >
                            Save
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </div>
    );
};