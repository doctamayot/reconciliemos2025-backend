require("dotenv").config();
const app = require("./src/app"); // Importa tu aplicación Express

const PORT = process.env.PORT || 3000; // Usa el puerto de .env o 3000 por defecto

app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en el puerto ${PORT} 🚀`);
});
