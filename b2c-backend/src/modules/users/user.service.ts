import { User } from './user.model';
import { AppError } from '../../common/errors/AppError';

export async function getById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

interface PreferenceUpdate {
  visualsPreferred?: boolean;
  dailyNotification?: boolean;
  timezone?: string;
}

export async function updatePreferences(id: string, prefs: PreferenceUpdate) {
  const set: Record<string, unknown> = {};
  if (prefs.visualsPreferred !== undefined) set['preferences.visualsPreferred'] = prefs.visualsPreferred;
  if (prefs.dailyNotification !== undefined) set['preferences.dailyNotification'] = prefs.dailyNotification;
  if (prefs.timezone !== undefined) set['preferences.timezone'] = prefs.timezone;

  const user = await User.findByIdAndUpdate(id, { $set: set }, { new: true });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}
