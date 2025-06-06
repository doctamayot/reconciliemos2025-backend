// src/controllers/userController.js
const userService = require("../services/userService");
const User = require("../models/User"); // Importación de User para el delete

// Admin: Obtener todos los usuarios
const getAllUsersByAdmin = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10),
      limit: parseInt(req.query.limit, 10),
      role: req.query.role,
      search: req.query.search, // <-- AÑADIDO
    };

    const paginatedData = await userService.getAllUsers(options);
    res.json(paginatedData);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Error al obtener los usuarios.' });
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

/**
 * @desc    Admin: Establece una nueva contraseña para un usuario
 * @route   PUT /api/users/:id/set-password
 * @access  Private (Admin)
 */
const adminSetPasswordController = async (req, res, next) => {
  const { id: userId } = req.params; // ID del usuario a modificar viene de la URL
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.status(400).json({ message: 'La nueva contraseña y su confirmación son requeridas.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
  }

  // Validar complejidad de la contraseña aquí también
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial.' });
  }

  try {
    await userService.adminSetUserPassword(userId, password);
    res.json({ message: 'Contraseña del usuario actualizada exitosamente.' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Error al actualizar la contraseña del usuario.' });
  }
};

module.exports = {
  getAllUsersByAdmin,
  getUserByIdByAdmin,
  updateUserByAdminController,
  deleteUserByAdmin,
  adminSetPasswordController
};
