const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
  const { album } = req.body;
  const tempPath = req.file.path;
  const albumPath = path.join('uploads', album || 'default');

  if (!fs.existsSync(albumPath)) {
    fs.mkdirSync(albumPath, { recursive: true });
  }

  const targetPath = path.join(albumPath, path.basename(tempPath));
  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      console.error('Error moving file:', err);
      return res.status(500).send('Error moving file');
    }
    res.json({ filePath: `/uploads/${album || 'default'}/${path.basename(targetPath)}` });
  });
});

// Create a new album
app.post('/albums', (req, res) => {
  // Albums are managed through the filesystem; this endpoint can be expanded
  // or updated to include album metadata if needed
  res.status(201).send('Album created');
});

// Get list of albums
app.get('/albums', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) {
      return res.status(500).send('Unable to list albums');
    }
    res.json(files.filter(file => fs.statSync(path.join('uploads', file)).isDirectory()));
  });
});

// Get images from an album
app.get('/albums/:album/images', (req, res) => {
  const album = req.params.album;
  const albumPath = path.join('uploads', album);

  fs.readdir(albumPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan files!');
    }
    const filePaths = files.map(file => `/uploads/${album}/${file}`);
    res.json(filePaths);
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
