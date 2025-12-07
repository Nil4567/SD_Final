import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DataService, Order, User } from '../../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-order-form',
  host: {
    class: 'block p-6 bg-white rounded-lg shadow-md'
  },
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule, CurrencyPipe]
})
export class OrderFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  orderForm!: FormGroup;
  isEditMode = false;
  orderId: string | null = null;
  users = this.dataService.users;
  isSaving = signal(false);
  
  orderNo = signal<number>(0);
  orderToken = signal<string>('');

  // Signal for contact number to check for regular customers
  private contactNoSignal = toSignal(
    this.fb.group({ contactNo: [''] }).controls['contactNo'].valueChanges.pipe(debounceTime(300)), 
    { initialValue: '' }
  );
  isRegularCustomer = computed(() => {
    const contactNo = this.contactNoSignal();
    // FIX: Add a type guard for `contactNo` as its type is inferred as `unknown` from the form control's `valueChanges`.
    if (typeof contactNo !== 'string' || !contactNo || contactNo.length < 10) return false;
    // Check if more than one order exists with this contact number (or one if we are not in edit mode)
    const orderCount = this.dataService.orders().filter(o => o.contactNo === contactNo).length;
    
    // In edit mode, a regular has > 1 order. In new mode, a regular has >= 1 order.
    if (this.isEditMode) {
       return orderCount > 1;
    }
    return orderCount >= 1;
  });

  ngOnInit(): void {
    this.initForm();
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.isEditMode = true;
      const order = this.dataService.getOrderById(this.orderId);
      if (order) {
        this.orderNo.set(order.orderNo);
        this.orderToken.set(order.orderToken);
        this.orderForm.patchValue({
          customerName: order.customerName,
          contactNo: order.contactNo,
          jobDescription: order.jobDescription,
          jobUrgency: order.jobUrgency,
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          advanceAmount: order.advanceAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          assignedToUserId: order.assignedToUserId || ''
        });
      } else {
        console.error('Order not found for ID:', this.orderId);
        this.router.navigate(['/orders']);
      }
    } else {
      // Logic for new order
      const allOrders = this.dataService.orders();
      const maxOrderNo = allOrders.length > 0 ? Math.max(...allOrders.map(o => o.orderNo || 0)) : 0;
      this.orderNo.set(maxOrderNo + 1);
      this.orderToken.set('SDP-' + Math.floor(1000 + Math.random() * 9000));
    }
    
    // Link the form control to the signal for regular customer check
    this.contactNoSignal = toSignal(
      this.orderForm.controls['contactNo'].valueChanges.pipe(debounceTime(300)),
      { initialValue: this.orderForm.controls['contactNo'].value }
    );
  }

  initForm(): void {
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      contactNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      jobDescription: ['', Validators.required],
      jobUrgency: ['Normal', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0.00, [Validators.required, Validators.min(0)]],
      advanceAmount: [0.00, [Validators.required, Validators.min(0)]],
      status: ['Pending', Validators.required],
      paymentStatus: ['Pending', Validators.required],
      assignedToUserId: ['']
    });
  }

  calculateTotalAmount(): number {
    const quantity = this.orderForm.get('quantity')?.value || 0;
    const unitPrice = this.orderForm.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  async onSubmit(): Promise<void> {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }
    
    this.isSaving.set(true);
    try {
      const formValue = this.orderForm.value;
      const orderData = {
        orderNo: this.orderNo(),
        orderToken: this.orderToken(),
        customerName: formValue.customerName,
        contactNo: formValue.contactNo,
        jobDescription: formValue.jobDescription,
        jobUrgency: formValue.jobUrgency,
        quantity: formValue.quantity,
        unitPrice: formValue.unitPrice,
        totalAmount: this.calculateTotalAmount(),
        advanceAmount: formValue.advanceAmount,
        status: formValue.status,
        paymentStatus: formValue.paymentStatus,
        assignedToUserId: formValue.assignedToUserId || undefined
      };

      if (this.isEditMode && this.orderId) {
        const currentOrder = this.dataService.getOrderById(this.orderId);
        if (currentOrder) {
          await this.dataService.updateOrder({ ...currentOrder, ...orderData });
        }
      } else {
        await this.dataService.addOrder(orderData as Omit<Order, 'id' | 'createdAt'>);
      }
      this.router.navigate(['/orders']);
    } catch (error) {
      console.error("Failed to save order:", error);
      alert("There was an error saving the order. Please try again.");
      this.isSaving.set(false);
    }
  }

  get formControl() {
    return this.orderForm.controls;
  }
}