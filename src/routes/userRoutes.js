// src/routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController"); // Importa el controlador
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// GET /api/users - Admin obtiene todos los usuarios
router.get(
  "/",
  protect,
  authorize(["admin"]),
  userController.getAllUsersByAdmin // Asegúrate que esta función exista en userController
);

// GET /api/users/:id - Admin obtiene un usuario por ID
router.get(
  "/:id",
  protect,
  authorize(["admin"]),
  userController.getUserByIdByAdmin // Asegúrate que esta función exista
);

// PUT /api/users/:id - Admin actualiza un usuario por ID
router.put(
  "/:id",
  protect,
  authorize(["admin"]),
  userController.updateUserByAdminController // Asegúrate que esta función exista
);

// DELETE /api/users/:id - Admin elimina un usuario por ID
router.delete(
  "/:id",
  protect,
  authorize(["admin"]),
  userController.deleteUserByAdmin // Asegúrate que esta función exista
);

module.exports = router; // Exporta el router
