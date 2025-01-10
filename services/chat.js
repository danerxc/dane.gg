import pool from '../db.js';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { WebSocket } from 'ws';

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

function setupWebSocket(server) {
    const wss = new WebSocketServer({ 
        server,
        path: '/api/chat'
    });

    wss.on('connection', (ws) => {
        sendMessageHistory(ws);

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());

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
                    data.message_type, 
                    data.message_color,
                    data.userUUID
                ]);

                const broadcastData = JSON.stringify({
                    type: 'message',
                    data: {
                        username: result.rows[0].username,
                        content: result.rows[0].content,
                        timestamp: result.rows[0].timestamp,
                        message_type: result.rows[0].message_type,
                        message_color: result.rows[0].message_color,
                        userUUID: result.rows[0].client_uuid,
                    }
                });

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(broadcastData);
                    }
                });
            } catch (err) {
                console.error('Error handling message:', err);
            }
        });
    });
}

async function sendMessageHistory(ws) {
    try {
        const { rows: messages } = await pool.query(
            'SELECT * FROM website.messages ORDER BY timestamp DESC LIMIT 50'
        );
        const historyMessages = messages.map(msg => ({...msg, isHistorical: true}));
        ws.send(JSON.stringify({ type: 'history', data: historyMessages }));
    } catch (err) {
        console.error('Error fetching message history:', err);
    }
}

export default setupWebSocket;