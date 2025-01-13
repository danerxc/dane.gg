import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

try {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    async function testConnection() {
        try {
            const result = await pool.query('SELECT NOW()');
            console.log('Database connected successfully:', result.rows[0].now);
            return true;
        } catch (error) {
            console.error('Connection test failed:', error.message);
            return false;
        }
    }

    async function createInitialUser() {
        if (!(await testConnection())) {
            process.exit(1);
        }
    
        const username = process.argv[2];
        const password = process.argv[3];
    
        if (!username || !password) {
            console.error('Usage: node createInitialUser.js <username> <password>');
            process.exit(1);
        }
    
        try {
            const existingUsers = await pool.query('SELECT COUNT(*) FROM website.users');
            
            if (parseInt(existingUsers.rows[0].count) > 0) {
                console.error('Users already exist in database');
                process.exit(1);
            }
    
            const hashedPassword = await bcrypt.hash(password, 10);
    
            await pool.query(
                'INSERT INTO website.users (username, password_hash, is_admin, totp_enabled) VALUES ($1, $2, true, false)',
                [username, hashedPassword]
            );
    
            console.log('Initial admin user created successfully');
        } catch (error) {
            console.error('Error creating initial user:', error.message);
        } finally {
            await pool.end();
        }
    }
    createInitialUser();
} catch (error) {
    console.error('Failed to initialize database connection:', error.message);
    process.exit(1);
}