require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const connectDB = require("./src/config/database");

const seedAdmin = async () => {
  await connectDB();

  try {
    // Eliminar admins existentes (opcional, cuidado en producción)
    // await User.deleteMany({ role: 'admin' });

    const adminEmail = "admin@reconciliemoscolombia.com"; // Email del admin
    const adminPassword = "C@limenio3125"; // Contraseña que cumple los requisitos

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("El usuario administrador ya existe.");
      // Opcional: Actualizar su contraseña si es necesario
      // existingAdmin.password = adminPassword;
      // await existingAdmin.save();
      // console.log('Contraseña del administrador actualizada.');
    } else {
      await User.create({
        email: adminEmail,
        password: adminPassword, // El modelo se encargará de hashearla
        role: "admin",
        firstName: "Admin",
        lastName: "Principal",
        cedula: "1234345",
      });
      console.log("Usuario administrador creado exitosamente!");
    }
  } catch (error) {
    console.error("Error al sembrar el administrador:", error);
  } finally {
    mongoose.disconnect();
    console.log("Desconectado de MongoDB.");
  }
};

seedAdmin();
