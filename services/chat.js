import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function sanitizeServerMessage(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    const needsSanitization = /[<>`]/.test(text);
    if (!needsSanitization) {
        return text.substring(0, 500).trim();
    }
    return text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/`{3}[\s\S]*?`{3}/g, "[code block removed]")
        .replace(/`[\s\S]*?`/g, "[inline code removed]")
        .substring(0, 500)
        .trim();
}

function isAdminFromJWT(jwtToken) {
    if (!jwtToken) return false;
    try {
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
        return decoded && decoded.is_admin;
    } catch (e) {
        return false;
    }
}

function broadcast(wss, data) {
    const msg = JSON.stringify(data);
    console.log(`[WSS Broadcast] Broadcasting message: ${msg} to ${wss.clients.size} clients`);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

function broadcastClientCount(wss) {
    const count = wss.clients.size;
    console.log(`[WSS broadcastClientCount] Current client count: ${count}`);
    broadcast(wss, { type: 'client_count_update', count });
}

async function sendMessageHistory(ws) {
    try {
        const { rows: dbMessages } = await pool.query(
            'SELECT id, username, content, timestamp, message_type, message_color, client_uuid FROM website.messages ORDER BY timestamp DESC LIMIT 50'
        );
        
        const historyMessagesForClient = dbMessages.map(msg => ({
            id: msg.id,
            username: msg.username,
            content: msg.content,
            timestamp: msg.timestamp,
            message_type: msg.message_type,
            message_color: msg.message_color,
            userUUID: msg.client_uuid,
            isHistorical: true
        }));
        
        ws.send(JSON.stringify({ type: 'history', data: historyMessagesForClient }));
    } catch (err) {
        console.error('Error fetching message history:', err);
    }
}

async function getChatAggregateStats() {
    try {
        const totalMessagesResult = await pool.query('SELECT COUNT(*) AS total_messages FROM website.messages');

        const uniquePostersResult = await pool.query(
            "SELECT COUNT(DISTINCT client_uuid) AS unique_posters FROM website.messages WHERE client_uuid IS NOT NULL AND client_uuid != '00000000-0000-0000-0000-000000000000'"
        );

        const stats = {
            totalMessages: parseInt(totalMessagesResult.rows[0]?.total_messages, 10) || 0,
            uniquePosters: parseInt(uniquePostersResult.rows[0]?.unique_posters, 10) || 0,
        };
        return stats;
    } catch (err) {
        console.error('[WSS getChatAggregateStats] Error fetching chat aggregate stats:', err);
        return {
            totalMessages: 0,
            uniquePosters: 0,
        };
    }
}

async function broadcastAggregateStats(wss) {
    const updatedAggStats = await getChatAggregateStats();
    broadcast(wss, { type: 'chat_aggregate_stats', data: updatedAggStats });
}

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/api/chat' });
    console.log('[WSS] WebSocket server setup on /api/chat');

    wss.on('connection', async (ws) => {
        console.log('[WSS Connection] Client connected.');
        sendMessageHistory(ws);
        broadcastClientCount(wss);
        await broadcastAggregateStats(wss);

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());

                // Moderation: Delete message
                if (data.type === 'delete_message' && isAdminFromJWT(data.jwt)) {
                    await pool.query('DELETE FROM website.messages WHERE id = $1', [data.messageId]);
                    broadcast(wss, { type: 'message_deleted', messageId: data.messageId });
                    await broadcastAggregateStats(wss);
                    return;
                }

                // Moderation: Change/remove username
                if (data.type === 'change_username' && isAdminFromJWT(data.jwt)) {
                    await pool.query('UPDATE website.messages SET username = $1 WHERE client_uuid = $2', [data.newUsername || 'Anonymous', data.userUUID]);
                    broadcast(wss, { type: 'username_changed', userUUID: data.userUUID, newUsername: data.newUsername || 'Anonymous' });
                    return;
                }

                // Moderation: Send admin message
                if (data.type === 'admin_message' && isAdminFromJWT(data.jwt)) {
                    const sanitizedContent = sanitizeServerMessage(data.content);
                    const ADMIN_UUID = '00000000-0000-0000-0000-000000000000';
                    const result = await pool.query(
                        `INSERT INTO website.messages (username, content, message_type, message_color, client_uuid)
                         VALUES ($1, $2, $3, $4, $5)
                         RETURNING id, username, content, timestamp, message_type, message_color, client_uuid`,
                        ['Admin', sanitizedContent, 'admin', '#ff0000', ADMIN_UUID]
                    );
                    broadcast(wss, {
                        type: 'message',
                        data: {
                            id: result.rows[0].id,
                            username: result.rows[0].username,
                            content: result.rows[0].content,
                            timestamp: result.rows[0].timestamp,
                            message_type: result.rows[0].message_type,
                            message_color: result.rows[0].message_color,
                            userUUID: result.rows[0].client_uuid,
                        }
                    });
                    await broadcastAggregateStats(wss);
                    return;
                }

                // Normal user message
                if (data.content && data.username && data.userUUID) {
                    const sanitizedContent = sanitizeServerMessage(data.content);
                    const sanitizedUsername = sanitizeServerMessage(data.username);

                    const query = `
                        INSERT INTO website.messages (username, content, message_type, message_color, client_uuid)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id, username, content, timestamp, message_type, message_color, client_uuid
                    `;
                    const result = await pool.query(query, [
                        sanitizedUsername, 
                        sanitizedContent, 
                        data.message_type || 'chat', 
                        data.message_color || '#ffffff',
                        data.userUUID
                    ]);

                    const newMsgData = {
                        id: result.rows[0].id,
                        username: result.rows[0].username,
                        content: result.rows[0].content,
                        timestamp: result.rows[0].timestamp,
                        message_type: result.rows[0].message_type,
                        message_color: result.rows[0].message_color,
                        userUUID: result.rows[0].client_uuid,
                    };
                    broadcast(wss, { type: 'message', data: newMsgData });
                    await broadcastAggregateStats(wss);
                }

            } catch (err) {
                console.error('Error handling message:', err);
            }
        });

        ws.on('close', () => {
            console.log('[WSS Connection] Client disconnected.');
            broadcastClientCount(wss);
        });

        ws.on('error', (error) => {
            console.error('[WSS Connection] WebSocket error on client:', error);
        });
    });
}

export default setupWebSocket;