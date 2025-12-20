import { LoginResponse, LoginResponseSchema, User, UserSchema } from '@agam-space/shared-types';
import { ApiClientError } from './api-client';
import { ClientRegistry } from '../init/client.registry';

export async function loginWithPassword(
  username: string,
  password: string
): Promise<LoginResponse> {
  try {
    return await ClientRegistry.getApiClient().fetchAndParse(
      '/v1/auth/login/password',
      LoginResponseSchema,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }
    );
  } catch (e) {
    if (e instanceof ApiClientError) {
      if (e.status === 401) {
        throw new Error('Invalid credentials');
      }
    }
    throw new Error(`Login failed`);
  }
}

export async function logoutApi() {
  await ClientRegistry.getApiClient().fetchRaw('/v1/auth/logout', { method: 'POST' });
}

export async function signupApi(username: string, email: string, password: string) {
  try {
    const res = await ClientRegistry.getApiClient().fetchAndParse(`/v1/auth/signup`, UserSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: email || undefined, password }),
    });
  } catch (e) {
    if (e instanceof ApiClientError) {
      if (e.status === 409) {
        throw new Error('Username or email already exists');
      }
    }
    throw new Error(`Signup failed: ${e}`);
  }
}

export async function fetchCurrentUserApi(): Promise<User> {
  return await ClientRegistry.getApiClient().fetchAndParse('/v1/me', UserSchema);
}
