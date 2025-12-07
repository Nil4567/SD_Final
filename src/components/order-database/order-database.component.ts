
import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DataService, Order } from '../../services/data.service';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-database',
  templateUrl: './order-database.component.html',
  styleUrl: './order-database.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
})
export class OrderDatabaseComponent {
  private dataService: DataService = inject(DataService);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  completedOrders = computed(() => {
    const allCompleted = this.dataService.orders().filter(o => o.status === 'Completed');
    if (this.isAdmin()) {
      return allCompleted;
    }
    // For staff, show only their assigned completed orders
    const userId = this.currentUser()?.id;
    return allCompleted.filter(o => o.assignedToUserId === userId);
  });

  users = this.dataService.users;
  loading = this.dataService.loading;

  getUserName(userId?: string): string {
    return userId ? (this.users().find(u => u.id === userId)?.name || 'N/A') : 'Unassigned';
  }

  calculateTAT(order: Order): number {
    const endDate = order.completedAt ? new Date(order.completedAt) : new Date();
    const created = new Date(order.createdAt);
    const diffTime = Math.abs(endDate.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  shareBill(order: Order): void {
    this.router.navigate(['/orders/bill', order.id]);
  }
}