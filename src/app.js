require("dotenv").config({ path: "../.env" }); // Asegura que .env se cargue desde la raíz
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

// Importar rutas (ejemplo, las crearemos luego)
const authRoutes = require("./routes/authRoutes"); // Importa tus rutas de autenticación
const userRoutes = require("./routes/userRoutes");

// Conectar a la base de datos
connectDB();

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL_FRONTEND || "http://localhost:5173", // Permite solicitudes desde tu frontend
    credentials: true, // Si necesitas enviar cookies o cabeceras de autorización
  })
);
app.use(express.json()); // Para parsear JSON en el body de las requests
app.use(express.urlencoded({ extended: true })); // Para parsear cuerpos urlencoded

// Rutas de Bienvenida (Ejemplo)
app.get("/", (req, res) => {
  res.json({
    message: "API de Reconciliemos Colombia funcionando correctamente! 🎉",
  });
});

// Usar las rutas de la API (ejemplo)
app.use("/api/auth", authRoutes); // Todas las rutas en authRoutes comenzarán con /api/auth
app.use("/api/users", userRoutes);

// Middleware para manejar errores 404 (Ruta no encontrada)
app.use((req, res, next) => {
  const error = new Error(`No Encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Middleware para manejar otros errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack, // No mostrar stack en producción
  });
});

module.exports = app;
