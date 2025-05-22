const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(" ")[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (sin la contraseña)
      // Usamos el ID del payload del token para buscar al usuario
      req.user = await userService.findUserById(decoded.user.id);
      // Alternativamente, si el payload del token ya tiene suficiente info (y confías en él):
      // req.user = decoded.user; // Esto adjunta el payload decodificado del token

      if (!req.user) {
        return res
          .status(401)
          .json({
            message: "No autorizado, token falló (usuario no encontrado).",
          });
      }

      next();
    } catch (error) {
      console.error("Error en middleware de protección:", error.message);
      return res.status(401).json({ message: "No autorizado, token falló." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No autorizado, no hay token." });
  }
};

// Middleware para autorizar basado en roles
const authorize = (roles = []) => {
  // roles puede ser un string (un solo rol) o un array de roles
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      // El usuario no está logueado o su rol no está en la lista de roles permitidos
      return res
        .status(403)
        .json({
          message: `Acceso denegado. Rol '${
            req.user ? req.user.role : "desconocido"
          }' no autorizado para este recurso.`,
        });
    }
    next(); // El usuario tiene el rol permitido
  };
};

module.exports = { protect, authorize };
