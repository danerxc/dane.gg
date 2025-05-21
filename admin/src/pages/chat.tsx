import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SendIcon from '@mui/icons-material/Send';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';
import GroupIcon from '@mui/icons-material/Group';

export const ChatModeration = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const [clientCount, setClientCount] = useState(0);
    const [totalMessages, setTotalMessages] = useState(0);
    const [uniquePosters, setUniquePosters] = useState(0);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogUser, setDialogUser] = useState<{ userUUID: string, username: string } | null>(null);
    const [newUsername, setNewUsername] = useState('');

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

            const ref = scrollContainerRef.current;
            if (ref) {
                wasAtBottomRef.current =
                    Math.abs(ref.scrollHeight - ref.scrollTop - ref.clientHeight) < 10;
            }

            if (data.type === 'history') {
                const normalizedHistory = data.data.map(msg => ({
                    ...msg,
                    client_uuid: msg.userUUID 
                })).reverse();
                setMessages(normalizedHistory);
            } else if (data.type === 'message') {
                const newMessage = {
                    ...data.data,
                    client_uuid: data.data.userUUID
                };
                if (wasAtBottomRef.current) {
                    setMessages(prev => [...prev, newMessage]);
                    setTimeout(() => scrollToBottom(), 0);
                } else {
                    setMessages(prev => [...prev, newMessage]);
                    setNewMessageWhileNotAtBottom(true);
                }
            } else if (data.type === 'message_deleted') {
                setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
            } else if (data.type === 'username_changed') {
                setMessages(prev => prev.map(msg =>
                    msg.client_uuid === data.userUUID
                        ? { ...msg, username: data.newUsername }
                        : msg
                ));
            } else if (data.type === 'client_count_update') {
                setClientCount(data.count);
            } else if (data.type === 'chat_aggregate_stats') {
                setTotalMessages(data.data.totalMessages);
                setUniquePosters(data.data.uniquePosters);
            }
        };
        wsRef.current.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
        wsRef.current.onclose = () => {
            console.log('WebSocket closed');
            setClientCount(0);
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

    // Helper for timestamp formatting
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday =
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();
        return isToday
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
    const [newMessageWhileNotAtBottom, setNewMessageWhileNotAtBottom] = useState(false);
    const wasAtBottomRef = useRef(true);
    const prevMessagesLength = useRef(0);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
        setNewMessageWhileNotAtBottom(false);
    };
    
    useLayoutEffect(() => {
        const ref = scrollContainerRef.current;
        if (!ref) return;
        if (messages.length > prevMessagesLength.current) {
            wasAtBottomRef.current =
                Math.abs(ref.scrollHeight - ref.scrollTop - ref.clientHeight) < 10;
        }
        prevMessagesLength.current = messages.length;
    }, [messages.length]);

    useLayoutEffect(() => {
        if (messages.length && !hasAutoScrolled) {
            scrollToBottom();
            setHasAutoScrolled(true);
        }
    }, [messages]);

    useEffect(() => {
        if (!hasAutoScrolled) return;
        if (wasAtBottomRef.current) {
            setTimeout(() => {
                scrollToBottom();
            }, 0);
            setNewMessageWhileNotAtBottom(false);
        } else {
            setNewMessageWhileNotAtBottom(true);
        }
    }, [messages, hasAutoScrolled]);

    const handleTableScroll = () => {
        const ref = scrollContainerRef.current;
        if (!ref) return;
        const isAtBottom =
            Math.abs(ref.scrollHeight - ref.scrollTop - ref.clientHeight) < 10;
        wasAtBottomRef.current = isAtBottom;
        if (isAtBottom) setNewMessageWhileNotAtBottom(false);
    };

    const StatCard = ({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) => (
        <Box
            sx={{
                background: '#232323',
                color: '#fff',
                padding: '15px',
                borderRadius: 2,
                border: '1px solid #333',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                flex: 1,
                minWidth: '150px',
            }}
        >
            {icon}
            <Typography variant="h6" sx={{ color: '#e48f8f', fontWeight: 'bold', mt: 1 }}>
                {value}
            </Typography>
            <Typography variant="caption" sx={{ color: '#aaa' }}>
                {title}
            </Typography>
        </Box>
    );

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
                position: 'relative',
            }}
        >
            {/* Stats Cards Row */}
            <Box sx={{ display: 'flex', gap: 2, marginBottom: 2, flexWrap: 'wrap' }}>
                <StatCard title="Connected Users" value={clientCount} icon={<PeopleIcon sx={{ fontSize: 30, color: '#7fd6ff' }} />} />
                <StatCard title="Total Messages" value={totalMessages} icon={<MessageIcon sx={{ fontSize: 30, color: '#7fd6ff' }} />} />
                <StatCard title="Unique Posters" value={uniquePosters} icon={<GroupIcon sx={{ fontSize: 30, color: '#7fd6ff' }} />} />
            </Box>

            {/* New messages pill */}
            {newMessageWhileNotAtBottom && (
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: 72,
                        transform: 'translateX(-50%)',
                        zIndex: 20,
                        background: '#e48f8f',
                        color: '#fff',
                        borderRadius: 999,
                        boxShadow: '0 2px 8px #0007',
                        cursor: 'pointer',
                        minWidth: 0,
                        padding: '8px 20px 8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        fontSize: 16,
                        border: '2px solid #fff',
                        opacity: 0.97,
                        gap: 8,
                        userSelect: 'none',
                        pointerEvents: 'auto',
                    }}
                    onClick={scrollToBottom}
                    title="Scroll to latest"
                >
                    <ArrowDownwardIcon fontSize="small" style={{ marginRight: 4 }} />
                    New messages
                </div>
            )}

            <div
                ref={scrollContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    border: '1px solid #222',
                    borderRadius: 6,
                    background: '#181818',
                    marginBottom: 16,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
                onScroll={handleTableScroll}
            >
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontFamily: 'monospace',
                        background: 'transparent',
                        color: '#fff',
                        fontSize: 14,
                    }}
                >
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
                                    {msg.timestamp ? formatTimestamp(msg.timestamp) : ''}
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
                                            cursor: msg.message_type === 'discord' ? 'not-allowed' : 'pointer',
                                            color: msg.message_type === 'discord' ? '#555' : '#7fd6ff',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            opacity: msg.message_type === 'discord' ? 0.5 : 1,
                                        }}
                                        title={msg.message_type === 'discord' ? 'Cannot change Discord usernames' : 'Change username'}
                                        onClick={() => {

                                            if (msg.message_type === 'discord') {
                                                return;
                                            }

                                            const userIdentifier = msg.client_uuid;

                                            if (typeof userIdentifier === 'string' && userIdentifier.length > 0) {
                                                openUsernameDialog(userIdentifier, msg.username);
                                            } else {
                                                console.error(`[Change Username Click] FAILED: client_uuid is invalid for message ID ${msg.id}. client_uuid: "${userIdentifier}"`);
                                            }
                                        }}
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