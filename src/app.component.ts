
import { Component, ChangeDetectionStrategy, inject, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule, Location as AngularLocation } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  host: {
    class: 'block min-h-screen'
  },
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule]
})
export class AppComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  // FIX: Explicitly use an aliased import for `Location` to prevent ambiguity with the global DOM `Location` type.
  private location: AngularLocation = inject(AngularLocation);

  title = 'SD Prints Management';
  isLoggedIn = this.authService.isLoggedIn;
  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  currentTime = signal<Date>(new Date());
  private timerSubscription: Subscription | undefined;
  
  currentRoute = signal<string>('');
  private routerSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.currentTime.set(new Date());
    });

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.currentRoute.set((event as NavigationEnd).urlAfterRedirects);
    });
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
  }

  goBack(): void {
    this.location.back();
  }

  showBackButton(): boolean {
    const noBackRoutes = ['/company-info', '/login', '/', '/dashboard'];
    return !noBackRoutes.includes(this.currentRoute());
  }
}