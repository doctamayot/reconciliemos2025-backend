const authService = require("../services/authService");
const userService = require("../services/userService");
// 'jsonwebtoken' ya no es necesario aquí si la activación con login automático se eliminó.

// console.log('[authController.js] Archivo cargado.'); // Puedes mantenerlo para depuración inicial

/**
 * @desc    Autenticar un usuario (login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Correo electrónico y contraseña son requeridos." });
  }

  try {
    const authResponse = await authService.loginUser(email, password);
    res.json({
      message: "Login exitoso",
      token: authResponse.token,
      user: authResponse.user,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({
        message: error.message || "Error en el servidor durante el login.",
      });
  }
};

/**
 * @desc    Obtener el perfil del usuario actualmente autenticado
 * @route   GET /api/auth/me
 * @access  Private (requiere token JWT - gestionado por middleware 'protect')
 */
const getMyProfile = async (req, res) => {
  // req.user es establecido por el middleware 'protect' en la capa de rutas.
  if (!req.user) {
    return res
      .status(404)
      .json({ message: "Usuario no encontrado en la solicitud." });
  }
  res.json(req.user);
};

/**
 * @desc    Admin crea un nuevo usuario (conciliador o tercero)
 * @route   POST /api/auth/admin/create-user
 * @access  Private (solo Admin - gestionado por middlewares 'protect' y 'authorize')
 */
const adminCreateUser = async (req, res, next) => {
  // Se asume que los middlewares 'protect' y 'authorize(['admin'])' ya validaron el acceso.
  // req.user está disponible y se sabe que es un admin.

  const {
    email,
    password,
    role,
    firstName,
    lastName,
    cedula,
    phoneNumber,
    numeroSicac,
  } = req.body;

  if (!email || !password || !role || !firstName || !lastName || !cedula) {
    return res
      .status(400)
      .json({
        message:
          "Email, contraseña, rol, nombre, apellidos y cédula son requeridos.",
      });
  }

  if (!["conciliador", "tercero"].includes(role)) {
    return res
      .status(400)
      .json({
        message:
          'Rol inválido. Solo se pueden crear roles de "conciliador" o "tercero".',
      });
  }

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res
      .status(400)
      .json({
        message:
          "La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial.",
      });
  }

  // El servicio userService.createUser ahora se encarga de la lógica de numeroSicac
  // y de activar al usuario por defecto.
  try {
    const newUser = await userService.createUser(req.body); // req.body ya tiene todos los campos
    res
      .status(201)
      .json({
        message: `Usuario ${role} creado y activado. Se ha enviado un correo informativo.`,
        user: newUser,
      });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res
      .status(statusCode)
      .json({ message: error.message || `Error al crear el usuario ${role}.` });
  }
};

// La función activateAccount y su endpoint correspondiente fueron eliminados
// ya que los usuarios creados por el admin ahora están activos por defecto.

module.exports = {
  login,
  getMyProfile,
  adminCreateUser,
  // activateAccount, // <- Eliminado
};
