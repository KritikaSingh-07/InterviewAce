import cloudinary from '../config/cloudinary.js';

/**
 * Uploads an image buffer directly to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @returns {Promise<object>}
 */
export const uploadToCloudinary = (fileBuffer, folder = 'InterviewAce/ProfileImages') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 512, height: 512, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};
