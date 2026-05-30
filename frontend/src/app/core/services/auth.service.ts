import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { ApiService } from './api.service';
import {
  AuthResponse,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
} from '../models/auth.model';
import { User } from '../models/user.model';

const TOKEN_KEY = 'criticomrade_token';
const USER_KEY = 'criticomrade_user';
const REMEMBER_KEY = 'criticomrade_remember_me';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(this.loadStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.token);

  constructor(private api: ApiService) {}

  get token(): string | null {
    return (
      localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
    );
  }

  get rememberMePreference(): boolean {
    return localStorage.getItem(REMEMBER_KEY) !== 'false';
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

  resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Observable<MessageResponse> {
    return this.api.post<MessageResponse>('/auth/reset-password', {
      email,
      code,
      newPassword,
    });
  }

  logout(): void {
    this.clearStoredSession();
    localStorage.removeItem(REMEMBER_KEY);
    this.currentUserSignal.set(null);
  }

  refreshCurrentUser(): Observable<User> {
    return this.api.get<AuthResponse>('/auth/me').pipe(
      map((response) => response.user),
      tap((user) => {
        this.sessionStorage().setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  bootstrapSession(): Observable<User | null> {
    if (!this.token) {
      return of(null);
    }
    return this.api.get<AuthResponse>('/auth/me').pipe(
      map((response) => response.user),
      tap((user) => {
        this.sessionStorage().setItem(USER_KEY, JSON.stringify(user));
        this.currentUserSignal.set(user);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  updateCurrentUser(user: User): void {
    this.sessionStorage().setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private setSession(response: AuthResponse, rememberMe: boolean): void {
    this.clearStoredSession();
    localStorage.setItem(REMEMBER_KEY, String(rememberMe));
    const storage = this.storageFor(rememberMe);
    storage.setItem(TOKEN_KEY, response.token);
    storage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUserSignal.set(response.user);
  }

  private loadStoredUser(): User | null {
    const raw =
      localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private sessionStorage(): Storage {
    return this.storageFor(this.rememberMePreference);
  }

  private storageFor(rememberMe: boolean): Storage {
    return rememberMe ? localStorage : sessionStorage;
  }

  private clearStoredSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}
