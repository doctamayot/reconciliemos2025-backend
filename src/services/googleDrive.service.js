const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const stream = require('stream');


// Cargar credenciales
const KEYFILEPATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Crear cliente de autenticación
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Sube un archivo a una carpeta específica de Google Drive.
 * @param {Object} fileObject - El objeto de archivo de multer (req.file).
 * @returns {Promise<string>} El ID del archivo subido en Google Drive.
 */
const uploadFile = async (fileObject) => {
  if (!fileObject) { throw new Error('No se proporcionó ningún archivo para subir.'); }
  
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileObject.buffer);

  try {
    const { data } = await drive.files.create({
      media: {
        mimeType: fileObject.mimetype,
        body: bufferStream,
      },
      requestBody: {
        name: `${Date.now()}-${fileObject.originalname}`,
        parents: [process.env.GOOGLE_DRIVE_PROFILE_PICS_FOLDER_ID],
      },
      // --- CAMBIADO: Pedimos más campos en la respuesta ---
      fields: 'id, webContentLink',
    });

    await drive.permissions.create({
      fileId: data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log(`[Google Drive] Archivo subido con ID: ${data.id} y URL: ${data.webContentLink}`);
    // --- CAMBIADO: Devolvemos un objeto con ambos datos ---
    return { fileId: data.id, webContentLink: data.webContentLink };
  } catch (error) {
    console.error('[Google Drive] Error al subir archivo:', error);
    throw new Error('Error al subir la imagen a Google Drive.');
  }
};

/**
 * Elimina un archivo de Google Drive.
 * @param {string} fileId - El ID del archivo a eliminar.
 * @returns {Promise<void>}
 */
const deleteFile = async (fileId) => {
  if (!fileId) return; // No hacer nada si no hay fileId
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    console.log(`[Google Drive] Archivo eliminado con ID: ${fileId}`);
  } catch (error) {
    console.error(`[Google Drive] Error al eliminar archivo ${fileId}:`, error);
    // No lanzamos un error fatal, solo lo logueamos, para que la operación principal no falle
  }
};

const getFileStream = async (fileId) => {
  try {
    const { data: fileStream } = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    return fileStream;
  } catch (error) {
    console.error(`[Google Drive] Error al obtener el stream del archivo ${fileId}:`, error);
    // Si el archivo no se encuentra en Drive, la API de Google lanzará un error que será capturado aquí.
    throw new Error('No se pudo obtener el archivo de imagen desde el servidor.');
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileStream, // <-- Exportar la nueva función
};

