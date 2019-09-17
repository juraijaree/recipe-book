import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService, AuthResponseData } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html'
})

export class AuthComponent {
  isLoginMode = true;
  isLoading = false;
  error: string = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }

    let authObservable: Observable<AuthResponseData>;

    const { email, password } = form.value;

    this.isLoading = true;

    if (this.isLoginMode) {
      authObservable = this.authService.login(email, password);
    } else {
      authObservable = this.authService.signUp(email, password);
    }

    authObservable.subscribe(responseData => {
      console.log(responseData);

      this.isLoading = false;

      this.router.navigate(['/recipes']);
    }, errorMsg => {
      console.log(errorMsg);

      this.error = errorMsg;

      this.isLoading = false;
    });

    form.reset();
  }

  onHandleError() {
    this.error = null;
  }
}
