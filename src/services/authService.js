const jwt = require("jsonwebtoken");
const userService = require("./userService");

const loginUser = async (email, password) => {
  // La siguiente línea es donde userService.findUserByEmail se llama.
  // Si hay un error DENTRO de findUserByEmail, podríamos no ver los logs siguientes.
  const userDocument = await userService.findUserByEmail(email);

  // Si el log anterior de userService.findUserByEmail no muestra "Después de User.findOne",
  // el error "user is not defined" podría NO ser en este archivo, sino DENTRO de findUserByEmail.
  // Si findUserByEmail lanza una excepción, este código no se ejecuta.

  if (!userDocument) {
    console.error(
      "[authService.loginUser] userService.findUserByEmail devolvió null/undefined."
    );
    const error = new Error(
      "Credenciales inválidas (usuario no encontrado por servicio)."
    );
    error.statusCode = 401;
    throw error;
  }

  if (!userDocument.isActive) {
    console.warn(
      `[authService.loginUser] Cuenta inactiva para: ${userDocument.email}`
    );
    const error = new Error(
      "Tu cuenta no está activa. Por favor, revisa tu correo electrónico para el enlace de activación o contacta al administrador."
    );
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await userDocument.comparePassword(password); // Llama al método del modelo
  if (!isMatch) {
    console.error("[authService.loginUser] Contraseña NO coincide.");
    const error = new Error("Credenciales inválidas (contraseña no coincide).");
    error.statusCode = 401;
    throw error;
  }

  const userObjectForPayload = userDocument.toObject
    ? userDocument.toObject()
    : { ...userDocument };

  const payload = {
    user: {
      id: userObjectForPayload._id.toString(),
      email: userObjectForPayload.email,
      role: userObjectForPayload.role,
    },
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });

  const userResponse = { ...userObjectForPayload };
  delete userResponse.password;
  delete userResponse.activationToken;
  delete userResponse.activationTokenExpires;
  delete userResponse.__v;

  return { token, user: userResponse };
};

module.exports = {
  loginUser,
};
