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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper function to check if a directory exists
const directoryExists = (dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
};

// Get list of albums
app.get('/albums', (req, res) => {
  console.log('Fetching albums...');
  const albumsPath = path.join(__dirname, 'uploads');
  fs.readdir(albumsPath, (err, files) => {
    if (err) {
      console.error('Error reading albums:', err);
      return res.status(500).json({ error: 'Error reading albums' });
    }
    const directories = files.filter(file => directoryExists(path.join(albumsPath, file)));
    console.log('Albums:', directories);
    res.json(directories);
  });
});

// Get images for a specific album
app.get('/albums/:album/images', (req, res) => {
  const album = req.params.album;
  const albumPath = path.join(__dirname, 'uploads', album);

  if (!directoryExists(albumPath)) {
    console.error(`Album "${album}" not found`);
    return res.status(404).json({ error: 'Album not found' });
  }

  fs.readdir(albumPath, (err, files) => {
    if (err) {
      console.error('Error reading images:', err);
      return res.status(500).json({ error: 'Error reading images' });
    }
    const imagePaths = files.map(file => `/uploads/${album}/${file}`);
    console.log(`Images for album "${album}":`, imagePaths);
    res.json(imagePaths);
  });
});

// Upload image
app.post('/upload', upload.single('image'), (req, res) => {
  const { album } = req.body;
  const tempPath = req.file.path;
  const albumPath = path.join(__dirname, 'uploads', album || 'default');

  if (!directoryExists(albumPath)) {
    fs.mkdirSync(albumPath, { recursive: true });
  }

  const targetPath = path.join(albumPath, path.basename(tempPath));
  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      console.error('Error moving file:', err);
      return res.status(500).json({ error: 'Error moving file' });
    }
    console.log(`Uploaded file to ${targetPath}`);
    res.json({ filePath: `/uploads/${album || 'default'}/${path.basename(targetPath)}` });
  });
});

// Create new album
app.post('/albums', (req, res) => {
  const { albumName } = req.body;
  const albumPath = path.join(__dirname, 'uploads', albumName);

  if (directoryExists(albumPath)) {
    console.error(`Album "${albumName}" already exists`);
    return res.status(400).json({ error: 'Album already exists' });
  }

  fs.mkdirSync(albumPath, { recursive: true });
  console.log(`Created album "${albumName}"`);
  res.sendStatus(201);
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
