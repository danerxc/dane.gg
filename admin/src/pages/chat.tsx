import React, { useEffect, useState, useRef } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SendIcon from '@mui/icons-material/Send'; // <-- Add this import

export const ChatModeration = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

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
                                            color: '#e48f8f',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                        }}
                                        title="Change username"
                                        onClick={() => {
                                            const newUsername = prompt('New username:', msg.username);
                                            if (newUsername !== null) changeUsername(msg.userUUID, newUsername);
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
        </div>
    );
};