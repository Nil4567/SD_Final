import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';

interface Customer {
  contactNo: string;
  name: string;
  orderCount: number;
  isRegular: boolean;
}

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class CustomerListComponent {
  private dataService = inject(DataService);

  loading = this.dataService.loading;
  
  customers = computed(() => {
    const orders = this.dataService.orders();
    const customerMap = new Map<string, { name: string; count: number }>();

    for (const order of orders) {
      if (order.contactNo) {
        if (customerMap.has(order.contactNo)) {
          const existing = customerMap.get(order.contactNo)!;
          existing.count++;
          // Update name to the one from the most recent order if different
          existing.name = order.customerName; 
        } else {
          customerMap.set(order.contactNo, { name: order.customerName, count: 1 });
        }
      }
    }

    const customerList: Customer[] = Array.from(customerMap.entries()).map(([contactNo, data]) => ({
      contactNo,
      name: data.name,
      orderCount: data.count,
      isRegular: data.count > 1,
    }));
    
    // Sort by most orders, then by name
    return customerList.sort((a, b) => {
      if (b.orderCount !== a.orderCount) {
        return b.orderCount - a.orderCount;
      }
      return a.name.localeCompare(b.name);
    });
  });
}
