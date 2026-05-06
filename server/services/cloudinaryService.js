const crypto = require('crypto');
const axios = require('axios');
const config = require('../config/env');

function signUploadParams(params, apiSecret) {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(`${payload}${apiSecret}`)
    .digest('hex');
}

async function uploadProfileImage(file, userId) {
  const { cloudName, apiKey, apiSecret, profileFolder } = config.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error('Cloudinary is not configured');
    error.statusCode = 503;
    throw error;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `user_${userId}`;
  const uploadParams = {
    folder: profileFolder,
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };

  const signature = signUploadParams(uploadParams, apiSecret);
  const fileData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const body = new URLSearchParams({
    ...uploadParams,
    api_key: apiKey,
    file: fileData,
    signature,
  });

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000,
  });

  return {
    avatarUrl: response.data.secure_url,
    avatarPublicId: response.data.public_id,
  };
}

module.exports = { uploadProfileImage };
