/**
 * Order notification feedback.
 * v1: haptics only (no sound asset shipped). When a sound asset is added later,
 * this becomes the single seam to wire expo-audio in.
 */
import * as Haptics from 'expo-haptics';

export async function playOrderNotification() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // haptics not available on simulator/web, silently no-op
  }
}
