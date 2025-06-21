// src/middlewares/uploadMiddleware.js
const multer = require('multer');

// Configuración para almacenar archivos en memoria, no en disco
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no permitido. Solo se aceptan imágenes.'), false);
    }
  },
});

module.exports = upload;