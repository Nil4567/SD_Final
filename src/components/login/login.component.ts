

import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  host: {
    class: 'block p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10'
  },
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule]
})
export class LoginComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  loginForm!: FormGroup;
  loginError = signal<string | null>(null);
  isLoggingIn = signal(false);

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoggingIn.set(true);
      this.loginError.set(null);
      const { username, password } = this.loginForm.value;

      const result = await this.authService.login(username, password);

      if (result.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.loginError.set(result.message || 'An unknown error occurred.');
      }
      this.isLoggingIn.set(false);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get formControl() {
    return this.loginForm.controls;
  }
}