const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas las rutas aquí están protegidas para admin
router.use(protect, authorize(['admin'])); // Aplicar middlewares a todas las rutas de este archivo

router.get('/', userController.getAllUsersByAdmin);
router.get('/:id', userController.getUserByIdByAdmin);
router.put('/:id', userController.updateUserByAdminController);
router.delete('/:id', userController.deleteUserByAdmin);

// --- NUEVA RUTA PARA ESTABLECER CONTRASEÑA ---
// PUT /api/users/:id/set-password
router.put('/:id/set-password', userController.adminSetPasswordController);
// --- FIN NUEVA RUTA ---

module.exports = router;
