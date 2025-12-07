import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, ViewChild, afterNextRender } from '@angular/core';
import { DataService, Order } from '../../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

declare const html2canvas: any;

@Component({
  selector: 'app-print-bill',
  templateUrl: './print-bill.component.html',
  styleUrl: './print-bill.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DatePipe]
})
export class PrintBillComponent {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('billElement') billElement!: ElementRef;

  order = signal<Order | null>(null);
  isLoading = signal(true);
  isSharing = signal(false);

  amountDue = signal(0);

  constructor() {
    afterNextRender(() => {
      const orderId = this.route.snapshot.paramMap.get('id');
      if (orderId) {
        const foundOrder = this.dataService.getOrderById(orderId);
        if (foundOrder) {
          this.order.set(foundOrder);
          this.amountDue.set(foundOrder.totalAmount - foundOrder.advanceAmount);
        } else {
          console.error('Order not found for bill view:', orderId);
          this.router.navigate(['/order-database']);
        }
      }
      this.isLoading.set(false);
    });
  }

  printBill(): void {
    window.print();
  }

  async shareAsImage(): Promise<void> {
    this.isSharing.set(true);
    try {
      const canvas = await html2canvas(this.billElement.nativeElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `SD-Prints-Bill-${this.order()?.orderNo}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Bill for Order #${this.order()?.orderNo}`,
          text: `Here is the bill for your order from SD Prints.`,
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `SD-Prints-Bill-${this.order()?.orderNo}.jpg`;
        link.click();
        alert('Image sharing not supported. The bill image has been downloaded instead.');
      }
    } catch (error) {
      console.error('Error generating or sharing image:', error);
      alert('Sorry, there was an error generating the image for sharing.');
    } finally {
      this.isSharing.set(false);
    }
  }
}
