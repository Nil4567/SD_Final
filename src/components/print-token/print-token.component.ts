import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, ViewChild, afterNextRender } from '@angular/core';
import { DataService, Order } from '../../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

// This is required to inform TypeScript that html2canvas will be available globally
declare const html2canvas: any;

@Component({
  selector: 'app-print-token',
  templateUrl: './print-token.component.html',
  styleUrl: './print-token.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DatePipe]
})
export class PrintTokenComponent {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('tokenElement') tokenElement!: ElementRef;

  order = signal<Order | null>(null);
  isLoading = signal(true);
  isSharing = signal(false);

  constructor() {
    afterNextRender(() => {
      const orderId = this.route.snapshot.paramMap.get('id');
      if (orderId) {
        const foundOrder = this.dataService.getOrderById(orderId);
        if (foundOrder) {
          this.order.set(foundOrder);
        } else {
          console.error('Order not found for token view:', orderId);
          this.router.navigate(['/orders']);
        }
      }
      this.isLoading.set(false);
    });
  }

  printToken(): void {
    window.print();
  }

  async shareAsImage(): Promise<void> {
    this.isSharing.set(true);
    try {
      const canvas = await html2canvas(this.tokenElement.nativeElement, {
        scale: 2, // Improve image quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `SD-Prints-Token-${this.order()?.orderToken}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `SD Prints Order Token ${this.order()?.orderToken}`,
          text: `Here is your order token from SD Prints.`,
          files: [file]
        });
      } else {
        // Fallback for browsers that don't support sharing files
        alert('Image sharing is not supported on this browser. You can save the image by right-clicking it.');
         // Or try to download it
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `SD-Prints-Token-${this.order()?.orderToken}.jpg`;
        link.click();
      }
    } catch (error) {
      console.error('Error generating or sharing image:', error);
      alert('Sorry, there was an error generating the image for sharing.');
    } finally {
      this.isSharing.set(false);
    }
  }
}
