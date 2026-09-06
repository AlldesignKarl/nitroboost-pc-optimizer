import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { addUser, findUserByUsername, getUsers } from './store';
import { AuthResult } from './shared/types';

const SALT_ROUNDS = 10;

export function hasAnyAccount(): boolean {
  return getUsers().length > 0;
}

export async function registerUser(username: string, password: string): Promise<AuthResult> {
  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    return { ok: false, error: 'El usuario debe tener al menos 3 caracteres.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }
  if (findUserByUsername(cleanUsername)) {
    return { ok: false, error: 'Ese usuario ya existe.' };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = {
    id: randomUUID(),
    username: cleanUsername,
    passwordHash,
    createdAt: Date.now()
  };
  addUser(user);
  return { ok: true, user: { id: user.id, username: user.username } };
}

export async function loginUser(username: string, password: string): Promise<AuthResult> {
  const user = findUserByUsername(username.trim());
  if (!user) {
    return { ok: false, error: 'Usuario o contraseña incorrectos.' };
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: 'Usuario o contraseña incorrectos.' };
  }
  return { ok: true, user: { id: user.id, username: user.username } };
}
