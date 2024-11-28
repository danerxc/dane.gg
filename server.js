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
const apiRoutes = require('./routes/api');
const blogRoutes = require('./routes/blog');
const webhookRoutes = require('./routes/webhooks');

// API routes
app.use('/api', apiRoutes);
app.use('/blog', blogRoutes);
app.use('/webhooks', webhookRoutes);

app.use((req, res, next) => {
  res.status(404).redirect(`/error.html?code=404`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).redirect(`/error.html?code=${statusCode}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));