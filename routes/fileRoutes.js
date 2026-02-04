const express = require('express');
const router = express.Router();
//const multer = require('multer');
//const path = require('path');
const filesController = require('../controllers/filesController');

// Configure Multer for file uploads
//const storage = multer.diskStorage({
  //destination: function (req, file, cb) {
    //cb(null, 'uploads/'); // folder to store uploaded files
  //},
  //filename: function (req, file, cb) {
    //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    //cb(null, uniqueSuffix + path.extname(file.originalname));
  //}
//});

//const upload = multer({ storage: storage });

// Routes
//router.post('/upload', upload.single('file'), filesController.uploadFile);
router.get('/myfiles', filesController.getFiles);
// Delete file route
// To this:
//router.post('/delete/:filename', filesController.deleteFile);


module.exports = router;