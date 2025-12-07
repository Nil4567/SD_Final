import { Routes } from '@angular/router';
import { CompanyInfoComponent } from './components/company-info/company-info.component'; // Renamed
import { OrderListComponent } from './components/order-list/order-list.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { LoginComponent } from './components/login/login.component'; // New
import { DashboardComponent } from './components/dashboard/dashboard.component'; // New actual dashboard
import { AuthGuard } from './guards/auth.guard'; // New AuthGuard
import { AdminGuard } from './guards/admin.guard';
import { UserFormComponent } from './components/user-form/user-form.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { OrderDatabaseComponent } from './components/order-database/order-database.component';
import { PrintTokenComponent } from './components/print-token/print-token.component';
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { PrintBillComponent } from './components/print-bill/print-bill.component';

export const routes: Routes = [
  { path: '', redirectTo: 'company-info', pathMatch: 'full' },
  { path: 'company-info', component: CompanyInfoComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }, // Protected
  { path: 'orders', component: OrderListComponent, canActivate: [AuthGuard] }, // Protected
  { path: 'orders/new', component: OrderFormComponent, canActivate: [AuthGuard] }, // Protected
  { path: 'orders/edit/:id', component: OrderFormComponent, canActivate: [AuthGuard] }, // Protected
  { path: 'orders/token/:id', component: PrintTokenComponent, canActivate: [AuthGuard] }, // New: Printable token view
  { path: 'orders/bill/:id', component: PrintBillComponent, canActivate: [AuthGuard] }, // New: Printable bill view
  { path: 'order-database', component: OrderDatabaseComponent, canActivate: [AuthGuard] }, // Staff can now access for billing
  { path: 'customers', component: CustomerListComponent, canActivate: [AuthGuard] }, // New: Customer database
  { path: 'tasks', component: TaskListComponent, canActivate: [AuthGuard] }, // Protected
  { path: 'tasks/new', component: TaskFormComponent, canActivate: [AuthGuard] }, // Protected
  { path: 'tasks/edit/:id', component: TaskFormComponent, canActivate: [AuthGuard] }, // Protected
  { path: 'users', component: UserListComponent, canActivate: [AuthGuard, AdminGuard] }, // Protected & Admin Only
  { path: 'users/new', component: UserFormComponent, canActivate: [AuthGuard, AdminGuard] }, // Protected & Admin Only
  { path: 'users/edit/:id', component: UserFormComponent, canActivate: [AuthGuard, AdminGuard] }, // Protected & Admin Only
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard, SuperAdminGuard] }, // Protected & Super Admin Only
  { path: '**', redirectTo: 'company-info' } // Wildcard route for any unmatched URL
];
