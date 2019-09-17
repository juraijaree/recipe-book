import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

import { User } from './user.model';
import { environment } from '../../environments/environment';

export interface AuthResponseData {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  kind: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  apiKey = environment.firebaseApiKey;

  signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.apiKey}`;
  loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`;

  user = new BehaviorSubject<User>(null);

  private tokenExpirationTimer: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  signUp(email: string, password: string) {
    return this.http.post<AuthResponseData>(this.signUpUrl, {
      email,
      password,
      returnSecureToken: true
    }).pipe(
      catchError(this.handleError),
      tap(({ email: userEmail, localId, idToken, expiresIn }) => {
        this.handleAuthentication(userEmail, localId, idToken, +expiresIn);
      })
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponseData>(this.loginUrl, {
      email,
      password,
      returnSecureToken: true
    }).pipe(
      catchError(this.handleError),
      tap(({ email: userEmail, localId, idToken, expiresIn }) => {
        this.handleAuthentication(userEmail, localId, idToken, +expiresIn);
      })
    );
  }

  autoLogin() {
    const userData: {
      email: string;
      id: string;
      tokenPrivate: string;
      tokenExpirationDatePrivate: string;
    } = JSON.parse(localStorage.getItem('userData'));

    if (!userData) {
      return;
    }

    const loadedUser = new User(
      userData.email,
      userData.id,
      userData.tokenPrivate,
      new Date(userData.tokenExpirationDatePrivate)
    );

    if (loadedUser.token) {
      this.user.next(loadedUser);

      const expirationDuration = new Date(userData.tokenExpirationDatePrivate).getTime() - new Date().getTime();

      this.autoLogout(expirationDuration);
    }
  }

  logout() {
    this.user.next(null);

    this.router.navigate(['/auth']);

    localStorage.removeItem('userData');

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private handleAuthentication(email: string, userId: string, token: string, expiresIn: number) {
    const expirationDate = new Date(new Date().getTime() + (expiresIn * 1000));
    const user = new User(email, userId, token, expirationDate);

    this.user.next(user);

    this.autoLogout(expiresIn * 1000);

    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(errorResponse: HttpErrorResponse) {
    let errorMsg = 'Error Occured!';

    if (!errorResponse.error || !errorResponse.error.error) {
      return throwError(errorMsg);
    }

    switch (errorResponse.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMsg = 'The email address is already in use by another account.';
        break;
      case 'OPERATION_NOT_ALLOWED':
        errorMsg = 'Password sign-in is disabled for this project.';
        break;
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        errorMsg = 'We have blocked all requests from this device due to unusual activity. Try again later.';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMsg = 'There is no user record corresponding to this identifier. The user may have been deleted.';
        break;
      case 'INVALID_PASSWORD':
        errorMsg = 'The password is invalid or the user does not have a password.';
        break;
      case 'USER_DISABLED':
        errorMsg = 'The user account has been disabled by an administrator.';
        break;
    }

    return throwError(errorMsg);
  }
}
