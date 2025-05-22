// src/controllers/userController.js
const userService = require("../services/userService");
const User = require("../models/User"); // Importación de User para el delete

// Admin: Obtener todos los usuarios
const getAllUsersByAdmin = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al obtener los usuarios." });
  }
};

// Admin: Obtener un usuario específico por ID
const getUserByIdByAdmin = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    res.json(user);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al obtener el usuario." });
  }
};

// Admin: Actualizar un usuario
const updateUserByAdminController = async (req, res, next) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const { password, ...updateData } = req.body;
    const updatedUser = await userService.updateUserByAdmin(
      req.params.id,
      updateData
    );
    res.json({
      message: "Usuario actualizado exitosamente.",
      user: updatedUser,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al actualizar el usuario." });
  }
};

// Admin: Eliminar un usuario (opcional)
const deleteUserByAdmin = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.params.id); // findUserById ya no devuelve error si no encuentra
    if (!user) {
      // Por eso verificamos aquí
      return res
        .status(404)
        .json({ message: "Usuario no encontrado para eliminar." });
    }
    // No permitir que un admin se elimine a sí mismo
    if (user._id.toString() === req.user.id.toString()) {
      // req.user viene del middleware 'protect'
      return res
        .status(400)
        .json({
          message: "No puedes eliminar tu propia cuenta de administrador.",
        });
    }

    await User.findByIdAndDelete(req.params.id); // Usando el modelo directamente para eliminar

    res.json({ message: "Usuario eliminado exitosamente." });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || "Error al eliminar el usuario." });
  }
};

module.exports = {
  getAllUsersByAdmin,
  getUserByIdByAdmin,
  updateUserByAdminController,
  deleteUserByAdmin,
};
