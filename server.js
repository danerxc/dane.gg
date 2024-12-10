import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import exphbs from 'express-handlebars';
import dotenv from 'dotenv';
import setupWebSocket from './services/chat.js';
import http from 'http';

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
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to dynamically serve .html files without the extension
app.use((req, res, next) => {
  if (!path.extname(req.url)) {
    const htmlFilePath = path.join(__dirname, 'public', `${req.url}.html`);
    
    res.sendFile(htmlFilePath, (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

// Import routes
import apiRoutes from './routes/api.js';
import blogRoutes from './routes/blog.js';
import webhookRoutes from './routes/webhooks.js';
import projectRoutes from './routes/projects.js';

// API routes
app.use('/api', apiRoutes);
app.use('/services/blog', blogRoutes);
app.use('/services/projects', projectRoutes);
app.use('/webhooks', webhookRoutes);

app.use((req, res, next) => {
  res.status(404).redirect(`/error.html?code=404`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).redirect(`/error.html?code=${statusCode}`);
});

setupWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));