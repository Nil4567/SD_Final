import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DataService, User } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-list',
  host: {
    class: 'block'
  },
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, DatePipe]
})
export class UserListComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  readonly superAdminUser: User = {
    id: 'admin-superuser',
    name: 'Super Admin (App Level)',
    role: 'Admin'
  };

  // Combine the special Super Admin user with the list of users from the Google Sheet.
  users = computed(() => {
    const sheetUsers = this.dataService.users();
    return [this.superAdminUser, ...sheetUsers];
  });
  
  loading = this.dataService.loading;
  lastUpdated = this.dataService.usersLastUpdated;
  
  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  async deleteUser(userId: string): Promise<void> {
    if (userId === this.superAdminUser.id) {
      alert('The Super Admin account is built-in and cannot be deleted.');
      return;
    }

    if (confirm('Are you sure you want to delete this user? This action is permanent and will be saved to the backend.')) {
      await this.dataService.deleteUser(userId);
    }
  }
}
