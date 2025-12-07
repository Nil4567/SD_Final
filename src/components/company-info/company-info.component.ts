
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-company-info',
  host: {
    class: 'block p-6 bg-white rounded-lg shadow-md'
  },
  templateUrl: './company-info.component.html',
  styleUrl: './company-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage]
})
export class CompanyInfoComponent implements OnInit, OnDestroy {
  didYouKnowFacts = [
    "Did you know: Digital printing offers quick turnaround times and cost-effectiveness for small batches?",
    "Did you know: High-resolution scanning can preserve old documents and photos digitally?",
    "Did you know: Custom marriage cards can reflect your unique story and theme?",
    "Did you know: A strong brand identity, crafted through graphic design, boosts customer recognition?",
    "Did you know: Modern printing technologies can produce vibrant colors and intricate details like never before?",
    "Did you know: Environmentally friendly printing options are becoming increasingly popular and accessible?",
    "Did you know: Professional binding services can give your documents a polished and durable finish?",
    "Did you know: The right font choice in design can significantly impact the message's perception?"
  ];

  currentFactIndex = signal(0);
  currentFact = computed(() => this.didYouKnowFacts[this.currentFactIndex()]);

  private factRotationSubscription: Subscription | undefined;

  ngOnInit(): void {
    // Rotate facts every 8 seconds
    this.factRotationSubscription = interval(8000).subscribe(() => {
      this.currentFactIndex.update(oldIndex => (oldIndex + 1) % this.didYouKnowFacts.length);
    });
  }

  ngOnDestroy(): void {
    this.factRotationSubscription?.unsubscribe();
  }
}
    