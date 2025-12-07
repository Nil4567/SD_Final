

import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DataService, User } from '../../services/data.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-form',
  host: {
    class: 'block p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto'
  },
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule, RouterLink]
})
export class UserFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  userForm!: FormGroup;
  isEditMode = false;
  userId: string | null = null;
  isSaving = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.isEditMode = true;
      const user = this.dataService.getUserById(this.userId);
      if (user) {
        this.userForm.patchValue({
          name: user.name,
          role: user.role,
        });
        // Make password optional for editing
        this.userForm.get('password')?.setValidators(null);
        this.userForm.get('password')?.updateValueAndValidity();

      } else {
        console.error('User not found for ID:', this.userId);
        this.router.navigate(['/users']);
      }
    }
  }

  initForm(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      role: ['Staff', Validators.required],
      password: ['', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    
    this.isSaving.set(true);

    try {
      const formValue = this.userForm.value;

      if (this.isEditMode && this.userId) {
        const currentUser = this.dataService.getUserById(this.userId);
        if (currentUser) {
          const updatedUserData: User = {
            ...currentUser,
            name: formValue.name,
            role: formValue.role
          };
          // Only update password if a new one is provided
          if (formValue.password) {
            updatedUserData.password = formValue.password;
          }
          await this.dataService.updateUser(updatedUserData);
        }
      } else {
        const newUserData: Omit<User, 'id'> = {
          name: formValue.name,
          role: formValue.role,
          password: formValue.password
        };
        await this.dataService.addUser(newUserData);
      }
      this.router.navigate(['/users']);
    } catch (error) {
       console.error("Failed to save user:", error);
      alert("There was an error saving the user. Please try again.");
      this.isSaving.set(false);
    }
  }

  get formControl() {
    return this.userForm.controls;
  }
}