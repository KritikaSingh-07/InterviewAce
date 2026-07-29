import cloudinary from '../config/cloudinary.js';

/**
 * Deletes an image from Cloudinary using its Public ID
 * @param {string} publicId 
 * @returns {Promise<object>}
 */
export const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error);
    throw error;
  }
};
