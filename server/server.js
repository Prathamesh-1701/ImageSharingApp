const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();

// Set up multer for file uploads
const upload = multer({ dest: 'temp/' });

// Middleware
app.use(express.json());
app.use(express.static('uploads'));

// Get list of albums
app.get('/albums', (req, res) => {
  const albumsPath = path.join(__dirname, 'uploads');
  fs.readdir(albumsPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading albums' });
    }
    const directories = files.filter(file => fs.statSync(path.join(albumsPath, file)).isDirectory());
    res.json(directories);
  });
});

// Get images for a specific album
app.get('/albums/:album/images', (req, res) => {
  const album = req.params.album;
  const albumPath = path.join(__dirname, 'uploads', album);

  fs.readdir(albumPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading images' });
    }
    const imagePaths = files.map(file => `/uploads/${album}/${file}`);
    res.json(imagePaths);
  });
});

// Upload image
app.post('/upload', upload.single('image'), (req, res) => {
  const { album } = req.body;
  const tempPath = req.file.path;
  const albumPath = path.join(__dirname, 'uploads', album || 'default');

  if (!fs.existsSync(albumPath)) {
    fs.mkdirSync(albumPath, { recursive: true });
  }

  const targetPath = path.join(albumPath, path.basename(tempPath));
  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error moving file' });
    }
    res.json({ filePath: `/uploads/${album || 'default'}/${path.basename(targetPath)}` });
  });
});

// Create new album
app.post('/albums', (req, res) => {
  const { albumName } = req.body;
  const albumPath = path.join(__dirname, 'uploads', albumName);

  if (!fs.existsSync(albumPath)) {
    fs.mkdirSync(albumPath, { recursive: true });
    res.sendStatus(201);
  } else {
    res.status(400).json({ error: 'Album already exists' });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
