import { FastifyReply } from 'fastify';
import { AgamCookies } from '@/modules/auth/auth.models';

export function setAuthCookies(
  res: FastifyReply,
  token: string,
  isSecure: boolean,
  maxAge: number = 30 * 24 * 60 * 60 // Default to 30 days
): void {
  const baseOptions = {
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };

  res.setCookie(AgamCookies.ACCESS_TOKEN, token, {
    ...baseOptions,
    httpOnly: true,
  });

  res.setCookie(AgamCookies.IS_AUTHENTICATED, 'true', {
    ...baseOptions,
    httpOnly: false,
  });
}

export function clearAuthCookies(res: FastifyReply): void {
  const baseOptions = {
    path: '/',
  };

  res.clearCookie(AgamCookies.ACCESS_TOKEN, baseOptions);
  res.clearCookie(AgamCookies.IS_AUTHENTICATED, baseOptions);
}
