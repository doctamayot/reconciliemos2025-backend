const User = require("../models/User");
const sendEmail = require("../utils/emailSender");
// require('dotenv').config(); // Asegúrate que dotenv se carga una vez globalmente (ej. en server.js)

/**
 * Encuentra un usuario por su correo electrónico.
 * @param {string} email - El correo electrónico del usuario.
 * @returns {Promise<UserDocument|null>} El documento del usuario o null si no se encuentra.
 */
const findUserByEmail = async (email) => {
  if (!email) {
    return null;
  }
  return await User.findOne({ email: email.toLowerCase() });
};

/**
 * Encuentra un usuario por su ID.
 * @param {string} id - El ID del usuario.
 * @returns {Promise<UserDocument|null>} El documento del usuario (sin contraseña) o null si no se encuentra.
 */
const findUserById = async (id) => {
  if (!id) return null;
  return await User.findById(id).select("-password");
};

/**
 * Crea un nuevo usuario (activo por defecto) y envía un correo informativo.
 * @param {Object} userData - Datos del usuario a crear.
 * @returns {Promise<Object>} El objeto del usuario creado (sin contraseña).
 */
const createUser = async (userData) => {
  const {
    email,
    password,
    role,
    firstName,
    lastName,
    cedula,
    phoneNumber,
    numeroSicac,
  } = userData;

  let existingUserByEmail = await findUserByEmail(email);
  if (existingUserByEmail) {
    const error = new Error("El correo electrónico ya está registrado.");
    error.statusCode = 409; // Conflict
    throw error;
  }

  if (cedula) {
    const existingUserByCedula = await User.findOne({ cedula });
    if (existingUserByCedula) {
      const error = new Error("El número de cédula ya está registrado.");
      error.statusCode = 409;
      throw error;
    }
  }

  const userToCreateData = {
    email,
    password, // El pre-save hook del modelo hasheará esto
    role: role || "tercero",
    firstName,
    lastName,
    cedula,
    phoneNumber,
    isActive: true, // ----> Usuario activo por defecto al ser creado por admin <----
  };

  if (role === "conciliador") {
    if (!numeroSicac) {
      const error = new Error(
        "El Número SICAAC es requerido para el rol de conciliador."
      );
      error.statusCode = 400; // Bad Request
      throw error;
    }
    const existingSicac = await User.findOne({ numeroSicac: numeroSicac, role: 'conciliador' });
    if (existingSicac) {
        const error = new Error('El Número SICAAC ya está registrado para otro conciliador.');
        error.statusCode = 409; throw error;
    }
    userToCreateData.numeroSicac = numeroSicac;
  } else  {
    // Ignorar numeroSicac si el rol no es conciliador
    // console.warn(`[userService.createUser] Se proveyó numeroSicac para un rol '${role}', será ignorado.`);
  }

  const user = new User(userToCreateData);
  await user.save(); // Guardar el usuario

  // --- EMAIL INFORMATIVO (SIN ENLACE DE ACTIVACIÓN) ---
  const logoUrl =
    process.env.LOGO_URL ||
    "https://via.placeholder.com/200x50.png?text=Reconciliemos+Colombia";
  const siteName = "Reconciliemos Colombia";
  const loginUrl = `${
    process.env.CLIENT_URL_FRONTEND || "http://localhost:5173"
  }/login`;

  const emailHtml = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
      <img src="${logoUrl}" alt="${siteName} Logo" style="max-width: 200px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
      <h1 style="color: #0056b3; margin:0;">¡Bienvenido a ${siteName}!</h1>
    </div>
    <div style="padding: 25px;">
      <p>Hola ${firstName || email},</p>
      <p>
        Un administrador ha creado y activado una cuenta para usted en la plataforma de ${siteName} con el rol de <strong>${role}</strong>.
        ${
          role === "conciliador" && numeroSicac
            ? `<br>Su Número SICAAC asignado es: <strong>${numeroSicac}</strong>.`
            : ""
        }
      </p>
      <p>Sus credenciales para acceder son:</p>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 8px;"><strong>Correo Electrónico:</strong> ${email}</li>
        <li style="margin-bottom: 8px;"><strong>Contraseña Asignada:</strong> ${password}</li> {/* Contraseña en texto plano enviada */}
      </ul>
      <p style="font-weight: bold; color: #d9534f;">
        Por su seguridad, le recomendamos encarecidamente cambiar esta contraseña después de su primer inicio de sesión.
      </p>
      <p>
        Puede iniciar sesión directamente en:
      </p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${loginUrl}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Iniciar Sesión</a>
      </p>
      <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
      <p>Atentamente,<br>El equipo de ${siteName}</p>
    </div>
    <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 0.9em; color: #777;">
      &copy; ${new Date().getFullYear()} ${siteName}. Todos los derechos reservados.
    </div>
  </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: `Bienvenido a ${siteName} - Su cuenta de ${role} ha sido creada y activada`,
      html: emailHtml,
    });
  } catch (emailError) {
    console.error(
      `FALLO AL ENVIAR EMAIL informativo para ${user.email}, pero el usuario fue creado y activado:`,
      emailError.message
    );
  }

  const userObject = user.toObject();
  delete userObject.password; // No devolver la contraseña hasheada
  return userObject;
};

/**
 * Obtiene todos los usuarios con paginación (para el admin).
 * @param {Object} options - Opciones de paginación.
 * @param {number} options.page - Número de página actual (ej. 1, 2, ...).
 * @param {number} options.limit - Número de usuarios por página.
 * @returns {Promise<Object>} Objeto con { users, totalUsers, currentPage, totalPages, hasMore }
 */
const getAllUsers = async (options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 15;
  const skip = (page - 1) * limit;

  
  // Construir el objeto de filtro para la consulta a MongoDB
  const queryFilter = {};
  if (options.role && options.role !== 'todos') {
    queryFilter.role = options.role;
  }
  
  // Lógica de búsqueda
  if (options.search) {
    const searchRegex = new RegExp(options.search, 'i'); // 'i' para búsqueda case-insensitive
    queryFilter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { cedula: searchRegex },
      { numeroSicac: searchRegex },
    ];
  } else {
    
  }

  

  try {
    const totalUsers = await User.countDocuments(queryFilter);
    const users = await User.find(queryFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users,
      totalUsers,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error("ERROR en la consulta de usuarios:", error);
    throw error;
  }
};

/**
 * Actualiza los datos de un usuario por parte del admin.
 * @param {string} userId - El ID del usuario a actualizar.
 * @param {Object} updateData - Los datos a actualizar.
 * @returns {Promise<Object>} El objeto del usuario actualizado (sin contraseña).
 */
const updateUserByAdmin = async (userId, updateData) => {
  const { password, ...validUpdateData } = updateData;
  let {
    email,
    role,
    firstName,
    lastName,
    phoneNumber,
    isActive,
    cedula,
    numeroSicac,
  } = validUpdateData;

  const userToUpdate = await User.findById(userId);
  if (!userToUpdate) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const originalRole = userToUpdate.role;

  if (email && email.toLowerCase() !== userToUpdate.email.toLowerCase()) {
    const existingEmailUser = await findUserByEmail(email);
    if (existingEmailUser && existingEmailUser._id.toString() !== userId) {
      const error = new Error(
        "El nuevo correo electrónico ya está en uso por otro usuario."
      );
      error.statusCode = 409;
      throw error;
    }
    userToUpdate.email = email.toLowerCase();
  }

  if (cedula && cedula !== userToUpdate.cedula) {
    const existingCedulaUser = await User.findOne({ cedula: cedula });
    if (existingCedulaUser && existingCedulaUser._id.toString() !== userId) {
      const error = new Error(
        "El número de cédula ya está en uso por otro usuario."
      );
      error.statusCode = 409;
      throw error;
    }
    userToUpdate.cedula = cedula;
  }

  if (role) userToUpdate.role = role;
  if (typeof firstName !== "undefined") userToUpdate.firstName = firstName;
  if (typeof lastName !== "undefined") userToUpdate.lastName = lastName;
  if (typeof phoneNumber !== "undefined")
    userToUpdate.phoneNumber = phoneNumber;
  // El admin puede cambiar isActive directamente
  if (typeof isActive === "boolean") userToUpdate.isActive = isActive;

  const finalRole = userToUpdate.role;

  if (finalRole === "conciliador") {
    if (typeof numeroSicac !== "undefined") {
      if (numeroSicac === "" || numeroSicac === null) {
        const error = new Error(
          "El Número SICAAC es requerido para el rol de conciliador y no puede estar vacío."
        );
        error.statusCode = 400;
        throw error;
      }
      const existingSicacUser = await User.findOne({
        numeroSicac,
        _id: { $ne: userId },
      });
      if (existingSicacUser) {
        const error = new Error(
          "El Número SICAAC ya está en uso por otro conciliador."
        );
        error.statusCode = 409;
        throw error;
      }
      userToUpdate.numeroSicac = numeroSicac;
    } else if (!userToUpdate.numeroSicac) {
      // Si no se envía numeroSicac y no lo tiene previamente
      const error = new Error(
        "Al mantener/asignar el rol de conciliador, el Número SICAAC es requerido."
      );
      error.statusCode = 400;
      throw error;
    }
  } else {
    userToUpdate.numeroSicac = null; // Limpiar si el rol no es conciliador
  }

  await userToUpdate.save();
  const userObject = userToUpdate.toObject();
  delete userObject.password;
  return userObject;
};

/**
 * Admin: Establece una nueva contraseña para un usuario específico.
 * @param {string} userId - El ID del usuario a actualizar.
 * @param {string} newPassword - La nueva contraseña en texto plano.
 * @returns {Promise<Object>} El objeto del usuario actualizado (sin contraseña).
 */
const adminSetUserPassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  // Asigna la nueva contraseña al campo 'password'.
  // El middleware pre('save') del modelo User.js se encargará de hashearla automáticamente.
  user.password = newPassword;
  await user.save(); // Guardar el usuario con la nueva contraseña hasheada

  // Opcional: Enviar un email informativo al usuario notificando el cambio de contraseña por parte de un admin
  // (Por ahora omitimos este envío para mantenerlo simple como solicitaste)

  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  adminSetUserPassword,
  getAllUsers,
  updateUserByAdmin,
};
