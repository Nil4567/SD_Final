

import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { User, DataService } from './data.service';
import { Router } from '@angular/router';

export interface LoginResult {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private dataService = inject(DataService);
  private router = inject(Router);

  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    const storedUser = localStorage.getItem('sv_user_data');
    if (storedUser) {
      this._currentUser.set(JSON.parse(storedUser));
      // When session is restored, load all data and start polling.
      this.dataService.triggerFullDataLoad().then(() => {
        this.dataService.startUserPolling();
      });
    }

    // --- NEW: Real-time Session Validation Effect ---
    // This effect continuously monitors the user list for changes.
    // If the currently logged-in user is removed from the backend,
    // their session is immediately terminated.
    effect(() => {
      const users = this.dataService.users();
      const currentUser = this.currentUser();
      const usersHaveLoaded = this.dataService.usersLastUpdated() !== null;

      // Only run validation if a user is logged in and the user list has been fetched at least once.
      if (currentUser && usersHaveLoaded) {
        // The built-in super admin is not in the list from the sheet, so we don't validate it.
        // This account can't be deleted via the UI anyway.
        if (currentUser.id === 'admin-superuser') {
          return;
        }

        const userStillExists = users.some(u => u.id === currentUser.id);

        if (!userStillExists) {
          console.warn('Current user not found in the user list. Forcing logout for security.');
          alert('Your user account has been removed or modified by an administrator. You will now be logged out.');
          this.logout();
        }
      }
    }, { allowSignalWrites: true }); // allowSignalWrites is necessary because logout() modifies signals.
  }

  async login(username: string, passwordAttempt: string): Promise<LoginResult> {
    // Check for hardcoded superuser/admin credentials first.
    if (username === 'admin' && passwordAttempt === 'admin123') {
      const adminUser: User = {
        id: 'admin-superuser',
        name: 'Super Admin',
        role: 'Admin'
      };
      
      this._currentUser.set(adminUser);
      localStorage.setItem('sv_user_data', JSON.stringify(adminUser));
      localStorage.setItem('sv_user_name', adminUser.name);
      localStorage.setItem('sv_user_token', `${adminUser.id}-${Date.now()}`);

      await this.dataService.triggerFullDataLoad();
      this.dataService.startUserPolling();
      return { success: true };
    }

    // If not the superuser, proceed with the normal Google Sheet lookup.
    // Load users on-demand if they aren't loaded yet.
    if (this.dataService.users().length === 0) {
      await this.dataService.loadUsers();
    }

    // Handle case where the Google Sheet for users is empty
    if (this.dataService.users().length === 0) {
      return { 
        success: false, 
        message: 'No user accounts found. The system may not be configured yet. Please contact the administrator.' 
      };
    }
    
    const user = this.dataService.getUserByName(username);

    if (user && user.password === passwordAttempt) {
      const userToStore = { ...user };
      delete userToStore.password;
      
      this._currentUser.set(userToStore);
      // Use a consistent key for the user object
      localStorage.setItem('sv_user_data', JSON.stringify(userToStore));
      // Set keys from user script for potential external compatibility
      localStorage.setItem('sv_user_name', user.name);
      localStorage.setItem('sv_user_token', `${user.id}-${Date.now()}`);
      
      await this.dataService.triggerFullDataLoad();
      this.dataService.startUserPolling();
      return { success: true };
    }
    
    this.clearSessionData();
    return { success: false, message: 'Invalid username or password. Please try again.' };
  }

  logout(): void {
    this.dataService.stopUserPolling();
    this.dataService.clearAllData(); // Clear all data from signals
    this.clearSessionData();
    this.router.navigate(['/company-info']);
  }

  private clearSessionData(): void {
    this._currentUser.set(null);
    localStorage.removeItem('sv_user_data');
    localStorage.removeItem('sv_user_name');
    localStorage.removeItem('sv_user_token');
  }
}