// src/utils/emailSender.js
const nodemailer = require("nodemailer");
// dotenv ya debería estar cargado globalmente en server.js o app.js
// require('dotenv').config(); // No es necesario si ya está cargado globalmente

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // o tu proveedor
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Para desarrollo con Gmail, podrías necesitar deshabilitar la protección contra remitentes no verificados
    // tls: {
    //   rejectUnauthorized: false
    // }
  });

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Reconciliemos Colombia"}" <${
      process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USERNAME
    }>`,
    to: options.email,
    subject: options.subject,
    html: options.html, // Recibiremos el HTML directamente
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado exitosamente: %s", info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Para Ethereal
    return info;
  } catch (error) {
    console.error("Error al enviar email desde emailSender:", error);
    throw new Error("Hubo un error al intentar enviar el correo electrónico.");
  }
};

module.exports = sendEmail;
