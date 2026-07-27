import { User } from './user.model';
import { AppError } from '../../common/errors/AppError';
import { invalidateUserAiModelCache } from '../ai-guidance/modelResolver';
import { isCloudinaryConfigured, uploadAvatarImage } from '../../config/cloudinary';

export async function getById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

interface PreferenceUpdate {
  visualsPreferred?: boolean;
  dailyNotification?: boolean;
  timezone?: string;
  aiModel?: string | null;
}

export interface ProfileUpdate {
  name?: string;
  imageUrl?: string;
  address?: string;
  profession?: string;
  experience?: string;
}

export async function updatePreferences(id: string, prefs: PreferenceUpdate) {
  const set: Record<string, unknown> = {};
  if (prefs.visualsPreferred !== undefined) set['preferences.visualsPreferred'] = prefs.visualsPreferred;
  if (prefs.dailyNotification !== undefined) set['preferences.dailyNotification'] = prefs.dailyNotification;
  if (prefs.timezone !== undefined) set['preferences.timezone'] = prefs.timezone;
  if (prefs.aiModel !== undefined) set['preferences.aiModel'] = prefs.aiModel;

  const user = await User.findByIdAndUpdate(id, { $set: set }, { new: true });
  if (!user) throw new AppError(404, 'User not found');
  if (prefs.aiModel !== undefined) invalidateUserAiModelCache(id);
  return user;
}

export async function updateProfile(id: string, profile: ProfileUpdate) {
  const set: Record<string, unknown> = {};
  if (profile.name !== undefined) set.name = profile.name;
  if (profile.imageUrl !== undefined) set.imageUrl = profile.imageUrl;
  if (profile.address !== undefined) set.address = profile.address;
  if (profile.profession !== undefined) set.profession = profile.profession;
  if (profile.experience !== undefined) set.experience = profile.experience;

  const user = await User.findByIdAndUpdate(id, { $set: set }, { new: true });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function uploadProfileAvatar(userId: string, file: Express.Multer.File) {
  if (!isCloudinaryConfigured()) {
    throw new AppError(503, 'Image upload is not configured. Set Cloudinary env vars.');
  }
  if (!file?.buffer?.length) {
    throw new AppError(400, 'Avatar image is required');
  }

  const imageUrl = await uploadAvatarImage(userId, file.buffer).catch(() => {
    throw new AppError(502, 'Could not upload image to Cloudinary');
  });
  return updateProfile(userId, { imageUrl });
}
