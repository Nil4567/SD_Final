
import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  host: {
    class: 'block'
  },
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, CommonModule]
})
export class DashboardComponent {
  private dataService = inject(DataService);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');
  isSuperAdmin = computed(() => this.currentUser()?.id === 'admin-superuser');
  settingsConfigured = this.settingsService.areSettingsConfigured;

  // --- Admin Metrics ---
  totalRevenue = this.dataService.totalRevenue;
  pendingOrdersCount = this.dataService.pendingOrdersCount;
  openTasksCount = this.dataService.openTasksCount;
  
  highPriorityTasksCount = computed(() => 
    this.dataService.tasks().filter(t => t.priority === 'High' && t.status !== 'Done').length
  );
  
  // --- Shared Data ---
  recentOrders = this.dataService.orders;
  users = this.dataService.users;
  loading = this.dataService.loading;

  // --- Staff-Specific Metrics ---
  myPendingOrders = computed(() => {
    const userId = this.currentUser()?.id;
    if (!userId) return [];
    return this.dataService.orders().filter(o => o.assignedToUserId === userId && o.status !== 'Completed');
  });

  myOpenTasks = computed(() => {
    const userId = this.currentUser()?.id;
    if (!userId) return [];
    return this.dataService.tasks().filter(t => t.assignedToUserId === userId && t.status !== 'Done');
  });
  
  // --- Upcoming Tasks (for both) ---
  upcomingTasks = computed(() =>
    this.dataService.tasks()
      .filter(task => task.status !== 'Done')
      // Custom sort: By priority first, then by due date
      .sort((a, b) => {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        const priorityA = priorityOrder[a.priority];
        const priorityB = priorityOrder[b.priority];
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.dueDate.getTime() - b.dueDate.getTime(); // Sort by soonest due date
      })
  );

  getUserName(userId?: string): string {
    return userId ? (this.users().find(u => u.id === userId)?.name || 'N/A') : 'Unassigned';
  }
}
