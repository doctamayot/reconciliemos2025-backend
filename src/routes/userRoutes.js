const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware')
const router = express.Router();

router.get('/:id/picture', userController.getUserPicture);

// Todas las rutas aquí están protegidas para admin


// PUT /api/users/:id/set-password
router.put('/:id/set-password', userController.adminSetPasswordController);

// --- NUEVAS RUTAS PARA FOTO DE PERFIL (Para el propio usuario logueado) ---
// Usaremos un prefijo como '/me/picture' para que actúe sobre el usuario de la sesión
// La ruta necesita el middleware 'protect' y el de 'upload' para procesar el archivo.
// .single('profilePicture') indica que esperamos un solo archivo con el nombre de campo 'profilePicture'.
router.put(
    '/me/picture',
    protect, // Cualquier usuario logueado puede cambiar su propia foto
    upload.single('profilePicture'),
    userController.uploadProfilePicture
);

router.delete(
    '/me/picture',
    protect, // Cualquier usuario logueado puede eliminar su propia foto
    userController.deleteProfilePicture
);



router.use(protect, authorize(['admin'])); // Aplicar middlewares a todas las rutas de este archivo

router.get('/', userController.getAllUsersByAdmin);
router.get('/:id', userController.getUserByIdByAdmin);
router.put('/:id', userController.updateUserByAdminController);
router.delete('/:id', userController.deleteUserByAdmin);



module.exports = router;
