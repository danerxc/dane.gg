import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import exphbs from 'express-handlebars';
import setupWebSocket from './services/chat.js';
import http from 'http';
import { login, createUser, getUsers, updateUser, deleteUser, getCurrentUser, updateAccountUsername, updateAccountPassword, checkUsernameAvailability } from './controllers/authController.js';
import { authenticateToken } from './middleware/auth.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

// Handlebars
app.engine('handlebars', exphbs.engine({
  extname: '.handlebars',
  defaultLayout: false,
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'public/templates'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import apiRoutes from './routes/api.js';
import blogRoutes from './routes/blog.js';
import projectRoutes from './routes/projects.js';
import webhookRoutes from './routes/webhooks.js';
import adminBlogRoutes from './routes/blogApi.js';

// Auth routes first
app.post('/auth/login', login);
// Account management routes
app.get('/auth/account/me', authenticateToken, getCurrentUser);
app.get('/auth/account/check-username', authenticateToken, checkUsernameAvailability);
app.put('/auth/account/username', authenticateToken, updateAccountUsername);
app.put('/auth/account/password', authenticateToken, updateAccountPassword);

// Protected API routes
app.get('/api/admin/users', authenticateToken, getUsers);
app.post('/api/admin/users', authenticateToken, createUser);
app.put('/api/admin/users/:id', authenticateToken, updateUser);
app.delete('/api/admin/users/:id', authenticateToken, deleteUser);

// API routes before static handling
app.use('/api/blog', adminBlogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', apiRoutes);
app.use('/webhooks', webhookRoutes);

// Middleware to remove trailing slashes
app.use((req, res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    const query = req.url.slice(req.path.length);
    const newPath = req.path.slice(0, -1);
    res.redirect(301, newPath + query);
  } else {
    next();
  }
});

// Serve static files without redirecting directories
app.use(express.static(path.join(__dirname, 'public'), { redirect: false }));

// Handle non-extension URLs
app.use((req, res, next) => {
  if (!path.extname(req.url)) {
    let sanitizedPath = path
      .normalize(req.url)
      .replace(/^(\.\.[\/\\])+/, '')
      .replace(/^\/+/, '');

    if (!sanitizedPath) {
      sanitizedPath = 'index';
    }

    if (sanitizedPath === 'projects') {
      sanitizedPath = 'projects/index';
    }

    const htmlFilePath = path.join(__dirname, 'public', `${sanitizedPath}.html`);

    res.sendFile(htmlFilePath, (err) => {
      if (err) {
        console.error(`Failed to send file: ${htmlFilePath}`, err);
        next();
      }
    });
  } else {
    next();
  }
});

// Admin SPA routes
app.use('/admin', express.static(path.join(__dirname, 'admin/dist')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/dist/index.html'));
});

// Public blog routes
app.use('/blog', blogRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).redirect(`/error.html?code=404`);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).redirect(`/error.html?code=${statusCode}`);
});

if (process.env.NODE_ENV === 'development') {
  app.use('/admin', createProxyMiddleware({ 
    target: 'http://localhost:3001',
    changeOrigin: true,
    ws: true
  }));
}

setupWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));