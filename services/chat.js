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
        console.log('Client connected to chat');

        sendMessageHistory(ws);

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log('Received message:', data);

                const query = `
                    INSERT INTO website.messages (username, content)
                    VALUES ($1, $2)
                    RETURNING id, username, content, timestamp
                `;
                const result = await pool.query(query, [data.username, data.content]);
                console.log('Saved message:', result.rows[0]);

                const broadcastData = JSON.stringify({
                    type: 'message',
                    data: {
                        username: result.rows[0].username,
                        content: result.rows[0].content,
                        timestamp: result.rows[0].timestamp
                    }
                });
                console.log('Broadcasting:', broadcastData);

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
            console.log('Client disconnected from chat');
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
            SELECT username, content, timestamp
            FROM website.messages 
            ORDER BY timestamp DESC 
            LIMIT 50
        `);

        ws.send(JSON.stringify({
            type: 'history',
            data: result.rows
        }));
    } catch (err) {
        console.error('Error fetching message history:', err);
    }
}

export default setupWebSocket;