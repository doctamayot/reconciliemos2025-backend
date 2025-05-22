const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // Opciones ya no son necesarias con Mongoose 6+
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true, // useCreateIndex ya no es soportado
      // useFindAndModify: false, // useFindAndModify ya no es soportado
    });
    console.log("MongoDB Conectado Exitosamente ✅");
  } catch (err) {
    console.error("Error al conectar con MongoDB ❌:", err.message);
    // Salir del proceso con falla si no se puede conectar
    process.exit(1);
  }
};

module.exports = connectDB;
