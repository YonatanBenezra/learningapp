import { Readable } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

let configured = false;

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export function ensureCloudinaryConfigured(): void {
  if (!isCloudinaryConfigured()) return;
  if (configured) return;
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  configured = true;
}

export async function uploadAvatarImage(
  userId: string,
  buffer: Buffer,
): Promise<string> {
  ensureCloudinaryConfigured();
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'b2c/avatars',
        public_id: userId,
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
        transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'auto' }],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve(result.secure_url);
      },
    );

    Readable.from(buffer).pipe(upload);
  });
}
