require("./env");
const { v2: cloudinary } = require("cloudinary");

function configured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function configure() {
  if (!configured()) throw new Error("Cloudinary is not configured.");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function uploadImage(buffer, folder, id) {
  configure();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder,
          public_id: `${id}-${Date.now()}`,
          overwrite: false,
          transformation: [{ width: 1600, height: 1600, crop: "limit" }, { quality: "auto" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result?.secure_url || !result.public_id) {
            reject(error || new Error("Cloudinary upload returned no URL"));
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .end(buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId || !configured()) return;
  configure();
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { configured, uploadImage, deleteImage };
