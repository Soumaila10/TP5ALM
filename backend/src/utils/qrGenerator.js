const QRCode = require('qrcode');

/**
 * Génère une image de QR Code au format Base64 à partir d'une chaîne de données.
 * @param {string} data - Les données à encoder (par ex. l'ID du ticket).
 * @returns {Promise<string>} - L'image au format Data URL (base64).
 */
async function generateQR(data) {
  try {
    return await QRCode.toDataURL(data, {
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    throw new Error(`Failed to generate QR code: ${err.message}`);
  }
}

module.exports = { generateQR };
