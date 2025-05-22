const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// crypto ya no es necesario aquí

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "El correo electrónico es obligatorio."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor, introduce un correo electrónico válido.",
      ],
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria."],
      minlength: [8, "La contraseña debe tener al menos 8 caracteres."],
      validate: {
        validator: function (v) {
          return /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
            v
          );
        },
        message: (props) =>
          `La contraseña debe contener al menos una letra mayúscula y un carácter especial.`,
      },
    },
    role: {
      type: String,
      enum: ["admin", "conciliador", "tercero"],
      default: "tercero",
    },
    firstName: {
      type: String,
      required: [true, "El nombre es obligatorio."],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Los apellidos son obligatorios."],
      trim: true,
    },
    cedula: {
      type: String,
      required: [true, "El número de cédula es obligatorio."],
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    numeroSicac: {
      // Solo aplica a conciliadores, manejado en el servicio
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      // Ahora por defecto true
      type: Boolean,
      default: true,
    },
    // activationToken y activationTokenExpires eliminados
  },
  {
    timestamps: true,
  }
);

// Middleware pre-save para password (sin cambios)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método comparePassword (sin cambios)
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Método createActivationToken ya no es necesario y se elimina

const User = mongoose.model("User", userSchema);
module.exports = User;
