import { BASE_WEB_URL } from '@/configs/config';

export function generateVerificationUrl(
  verificationToken: string,
  action: 'verify' | 'reverify' | 'changePassword',
): string {
  return `${BASE_WEB_URL}/${action}/${verificationToken}`;
}
