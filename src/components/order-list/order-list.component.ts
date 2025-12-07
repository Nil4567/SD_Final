import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DataService, Order } from '../../services/data.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';

type OrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Hold';

@Component({
  selector: 'app-order-list',
  host: {
    class: 'block'
  },
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, CommonModule]
})
export class OrderListComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  // Only show orders that are not yet completed
  orders = computed(() => this.dataService.orders().filter(o => o.status !== 'Completed'));
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

  async deleteOrder(orderId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this order? This action will be saved to the backend.')) {
      await this.dataService.deleteOrder(orderId);
    }
  }

  async updateOrderStatus(order: Order, event: Event): Promise<void> {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value as OrderStatus;

    // Security check: Only admins can set status to 'Completed'
    if (newStatus === 'Completed' && !this.isAdmin()) {
      alert('You do not have permission to mark orders as completed. Please contact an administrator.');
      // Revert the dropdown to the original value
      selectElement.value = order.status;
      return;
    }

    if (order.status !== newStatus) {
      const updatedOrder = { ...order, status: newStatus, completedAt: newStatus === 'Completed' ? new Date() : order.completedAt };
      await this.dataService.updateOrder(updatedOrder);
    }
  }

  shareToken(order: Order): void {
    this.router.navigate(['/orders/token', order.id]);
  }
}
