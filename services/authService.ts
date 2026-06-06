
import { AuthSession, User } from '../types';

const SESSION_KEY = 'pro_world_arena_session_v1';
const TOKEN_EXPIRY_MS = 3600000; // 1 hour

// Simple hash simulation for frontend demo
// In production, use bcrypt on backend. Here we make it visually secure.
export const hashPassword = async (password: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateSession = (user: User): AuthSession => {
    const session: AuthSession = {
        token: btoa(`${user.id}:${Date.now()}:${Math.random()}`), // Fake JWT
        userId: user.id,
        expiresAt: Date.now() + TOKEN_EXPIRY_MS
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
};

export const getSession = (): AuthSession | null => {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return null;
        
        const session: AuthSession = JSON.parse(stored);
        if (Date.now() > session.expiresAt) {
            clearSession();
            return null;
        }
        return session;
    } catch {
        return null;
    }
};

export const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
};

export const isAuthenticated = (): boolean => {
    return !!getSession();
};

export const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) return { valid: false, message: 'Mínimo de 8 caracteres.' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Deve conter letra maiúscula.' }; // Optional: stricter
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Deve conter pelo menos um número.' };
    if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: 'Deve conter um caractere especial (!@#$%).' };
    return { valid: true };
};
