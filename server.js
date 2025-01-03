import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
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

// Import routes
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import blogRoutes from './routes/blog.js';
import webhookRoutes from './routes/webhooks.js';

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
setupWebSocket(server);

app.use((req, res, next) => {
  if (!req.cookies.vid) {
    res.cookie('vid', crypto.randomUUID(), {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'strict'
    });
  }
  next();
});

app.use(trackPageView);

// API routes before static handling
app.use('/auth', authRoutes)
app.use('/api', apiRoutes);
app.use('/webhooks', webhookRoutes);

// Public blog routes
app.use('/blog', blogRoutes);

// Admin SPA routes
app.use('/admin', express.static(path.join(__dirname, 'admin/dist')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/dist/index.html'));
});

// Middleware to remove trailing slashes
app.use((req, res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    const query = req.url.slice(req.path.length);
    const newPath = req.path.slice(0, -1);
    return res.redirect(301, newPath + query);
  }
  next();
});

// Handle non-extension URLs
app.use((req, res, next) => {
  if (!path.extname(req.url)) {
    let sanitizedPath = path
      .normalize(req.url)
      .replace(/^(\.\.[\\/])+/, '')
      .replace(/^\/+/, '');

    if (!sanitizedPath) {
      sanitizedPath = 'index';
    }

    if (sanitizedPath === 'projects') {
      sanitizedPath = 'projects/index';
    }

    const htmlFilePath = path.join(__dirname, 'public', `${sanitizedPath}.html`);

    return res.sendFile(htmlFilePath, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  }
  next();
});

// Serve static files without redirecting directories
app.use(express.static(path.join(__dirname, 'public'), { redirect: false }));

// Track views after response is finished
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      trackPageView(req, res, () => {});
    }
  });
  next();
});

// 404 handler
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).redirect('/error.html?code=404');
  }
});

// Error handler
app.use((err, req, res, next) => {
  if (!res.headersSent) {
    res.status(500).redirect('/error.html?code=500');
  }
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