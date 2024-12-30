import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import exphbs from 'express-handlebars';
import setupWebSocket from './services/chat.js';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { trackPageView } from './middleware/stats.js';
import cookieParser from 'cookie-parser';

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

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(trackPageView);
setupWebSocket(server);

// Import routes
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import blogRoutes from './routes/blog.js';
import webhookRoutes from './routes/webhooks.js';

// API routes before static handling
app.use('/auth', authRoutes)
app.use('/api', apiRoutes);
app.use('/webhooks', webhookRoutes);

// Public blog routes
app.use('/blog', blogRoutes);

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

// Serve static files without redirecting directories
app.use(express.static(path.join(__dirname, 'public'), { redirect: false }));

// Admin SPA routes
app.use('/admin', express.static(path.join(__dirname, 'admin/dist')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/dist/index.html'));
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).redirect(`/error.html?code=404`);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).redirect(`/error?code=${statusCode}`);
});

if (process.env.NODE_ENV === 'development') {
  app.use('/admin', createProxyMiddleware({ 
    target: 'http://localhost:3001',
    changeOrigin: true,
    ws: true
  }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));