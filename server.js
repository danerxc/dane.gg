const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();

const app = express();

// Handlebars
app.engine('handlebars', exphbs.engine({
    extname: '.handlebars',
    defaultLayout: false,
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'public/templates'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'public' directory
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
const apiRoutes = require('./routes/api');
const blogRoutes = require('./routes/blog');
const webhookRoutes = require('./routes/webhooks');

// API routes
app.use('/api', apiRoutes);
app.use('/blog', blogRoutes);
app.use('/webhooks', webhookRoutes);

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));