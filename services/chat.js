// services/chat.js
import pg from 'pg';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

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

                const query = `
                    INSERT INTO website.messages (username, content, message_type, message_color, client_uuid)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, username, content, timestamp, message_type, message_color, client_uuid
                `;
                const result = await pool.query(query, [
                    data.username, 
                    data.content, 
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
                        isHistorical: false 
                    }
                });

                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(broadcastData);
                    }
                });
            } catch (err) {
                console.error('Error handling message:', err);
            }
        });

        ws.on('close', () => {
            // Do nothing
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    return wss;
}

async function sendMessageHistory(ws) {
    try {
        const result = await pool.query(`
            SELECT username, content, timestamp, message_type, message_color, client_uuid
            FROM website.messages 
            WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
            ORDER BY timestamp DESC 
            LIMIT 50
        `);

        // Add isHistorical flag to each message
        const historicalMessages = result.rows.map(msg => ({
            ...msg,
            isHistorical: true
        }));

        ws.send(JSON.stringify({
            type: 'history',
            data: historicalMessages
        }));
    } catch (err) {
        console.error('Error fetching message history:', err);
    }
}

export default setupWebSocket;