import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { ApiService } from './api.service';
import {
  AuthResponse,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
} from '../models/auth.model';
import { User } from '../models/user.model';
import { storage } from '../utils/storage';

const TOKEN_KEY = 'criticomrade_token';
const USER_KEY = 'criticomrade_user';
const REMEMBER_KEY = 'criticomrade_remember_me';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly tokenSignal = signal<string | null>(
    storage.get(TOKEN_KEY) ?? storage.get(TOKEN_KEY, 'session')
  );
  private readonly currentUserSignal = signal<User | null>(
    storage.getJson<User>(USER_KEY) ?? storage.getJson<User>(USER_KEY, 'session')
  );

  readonly currentUser = this.currentUserSignal.asReadonly();
  /** Reactive: updates on login, logout and expired sessions. */
  readonly isLoggedIn = computed(() => !!this.tokenSignal());

  get token(): string | null {
    return this.tokenSignal();
  }

  get rememberMePreference(): boolean {
    return storage.get(REMEMBER_KEY) !== 'false';
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const rememberMe = credentials.rememberMe ?? false;
    return this.api
      .post<AuthResponse>('/auth/login', { ...credentials, rememberMe })
      .pipe(tap((response) => this.setSession(response, rememberMe)));
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/register', data)
      .pipe(tap((response) => this.setSession(response, true)));
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.api.post<MessageResponse>('/auth/forgot-password', { email });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<MessageResponse> {
    return this.api.post<MessageResponse>('/auth/reset-password', { email, code, newPassword });
  }

  logout(): void {
    this.clearStoredSession();
    storage.remove(REMEMBER_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  refreshCurrentUser(): Observable<User> {
    return this.api.get<AuthResponse>('/auth/me').pipe(
      map((response) => response.user),
      tap((user) => this.updateCurrentUser(user))
    );
  }

  bootstrapSession(): Observable<User | null> {
    if (!this.token) {
      return of(null);
    }
    return this.refreshCurrentUser().pipe(
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  updateCurrentUser(user: User): void {
    storage.setJson(USER_KEY, user, this.rememberMePreference ? 'local' : 'session');
    this.currentUserSignal.set(user);
  }

  private setSession(response: AuthResponse, rememberMe: boolean): void {
    this.clearStoredSession();
    storage.set(REMEMBER_KEY, String(rememberMe));
    const kind = rememberMe ? 'local' : 'session';
    storage.set(TOKEN_KEY, response.token, kind);
    storage.setJson(USER_KEY, response.user, kind);
    this.tokenSignal.set(response.token);
    this.currentUserSignal.set(response.user);
  }

  private clearStoredSession(): void {
    for (const kind of ['local', 'session'] as const) {
      storage.remove(TOKEN_KEY, kind);
      storage.remove(USER_KEY, kind);
    }
  }
}
