import Toast from 'react-native-toast-message';
import { TOAST_DURATION } from '@/lib/constants';

export const showToast = {
  success: (text: string, subtext?: string) =>
    Toast.show({
      type: 'success',
      text1: text,
      text2: subtext,
      visibilityTime: TOAST_DURATION.medium,
      position: 'bottom',
    }),
  error: (text: string, subtext?: string) =>
    Toast.show({
      type: 'error',
      text1: text,
      text2: subtext,
      visibilityTime: TOAST_DURATION.medium,
      position: 'bottom',
    }),
  info: (text: string, subtext?: string) =>
    Toast.show({
      type: 'info',
      text1: text,
      text2: subtext,
      visibilityTime: TOAST_DURATION.short,
      position: 'bottom',
    }),
};
