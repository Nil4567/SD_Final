
import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { SettingsService } from './settings.service';
import { MOCK_USERS, MOCK_ORDERS, MOCK_TASKS } from '../data/mock-data';

// --- INTERFACES ---
export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Staff';
  password?: string;
}

export interface Order {
  id: string;
  orderNo: number;
  orderToken: string;
  customerName: string;
  contactNo: string;
  jobDescription: string;
  jobUrgency: 'Normal' | 'High' | 'Urgent';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  advanceAmount: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Hold';
  paymentStatus: 'Pending' | 'Paid';
  assignedToUserId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Task {
  id: string;
  description: string;
  assignedToUserId?: string;
  dueDate: Date;
  status: 'Open' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DataService implements OnDestroy {
  private settingsService = inject(SettingsService);

  // --- STATE SIGNALS ---
  private _users = signal<User[]>([]);
  private _orders = signal<Order[]>([]);
  private _tasks = signal<Task[]>([]);
  
  readonly users = this._users.asReadonly();
  readonly orders = this._orders.asReadonly();
  readonly tasks = this._tasks.asReadonly();
  
  loading = signal<boolean>(false);
  usersLastUpdated = signal<Date | null>(null);
  private userPollingInterval: ReturnType<typeof setInterval> | null = null;
  private mockDataLoaded = false;

  // --- COMPUTED DASHBOARD METRICS ---
  totalRevenue = computed(() =>
    this.orders().filter(o => o.paymentStatus === 'Paid').reduce((sum, order) => sum + order.totalAmount, 0)
  );
  pendingOrdersCount = computed(() =>
    this.orders().filter(o => o.status !== 'Completed').length
  );
  openTasksCount = computed(() =>
    this.tasks().filter(t => t.status !== 'Done').length
  );
  
  constructor() {
    // Data is no longer loaded on service instantiation.
    // It will be triggered by AuthService after a successful login.
  }

  ngOnDestroy(): void {
    this.stopUserPolling();
  }

  async triggerFullDataLoad(): Promise<void> {
    if (!this.settingsService.areSettingsConfigured()) {
      console.log('Settings not configured, loading mock data.');
      this.loading.set(true);
      // Simulate a small delay to make loading seem real
      setTimeout(() => {
        this._loadMockDataIfEmpty();
        this.loading.set(false);
      }, 500);
      return;
    }

    this.loading.set(true);
    await Promise.all([
      this.loadUsers(),
      this.loadOrders(),
      this.loadTasks()
    ]);
    this.loading.set(false);

    // After attempting to load real data, load mock data if all are still empty
    this._loadMockDataIfEmpty();
  }

  clearAllData(): void {
    this._users.set([]);
    this._orders.set([]);
    this._tasks.set([]);
    this.usersLastUpdated.set(null);
    this.mockDataLoaded = false;
  }
  
  private _loadMockDataIfEmpty(): void {
    // Only load mock data if no real data was fetched and it hasn't been loaded before
    if (this.users().length === 0 && this.orders().length === 0 && this.tasks().length === 0 && !this.mockDataLoaded) {
      console.warn("No data found from backend or backend not configured. Loading mock data for demonstration.");
      this._users.set(MOCK_USERS);
      this._orders.set(MOCK_ORDERS);
      this._tasks.set(MOCK_TASKS);
      this.mockDataLoaded = true; // Set flag to prevent re-loading
    }
  }

  // --- CORE GOOGLE SCRIPT COMMUNICATION ---
  /**
   * Performs a fetch request with a timeout and improved error handling.
   * This is the central method for all communication with the Google Apps Script.
   */
  private async performFetchWithTimeout(payload: object, timeoutMs = 20000): Promise<any> {
    const scriptUrl = this.settingsService.scriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script URL is not configured. Please set it in the Admin Settings.');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'cors', // Be explicit about CORS to enhance reliability
        headers: { 'Content-Type': 'text/plain' }, // Simplify header to prevent potential proxy/firewall issues
        body: JSON.stringify(payload),
        redirect: 'follow',
        cache: 'no-cache', // Prevent caching of script responses
        signal: controller.signal // Link the abort controller for timeout
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The server is not responding.');
      }
      throw new Error('A network error occurred. Please check your internet connection and the Google Apps Script configuration.');
    }
  }

  private async sendDataToScript(dataObject: any, dataType: string): Promise<boolean> {
    if (!this.settingsService.areSettingsConfigured()) {
      alert('Application is not configured. Please ask the super admin to set the Script URL and Security Token in Settings.');
      return false;
    }
    const payload = { appToken: this.settingsService.securityToken(), dataType, data: dataObject };
    try {
      const result = await this.performFetchWithTimeout(payload);

      if (result.result === 'success') {
        return true;
      } else {
        console.error("Server logic error on submission:", result.error);
        alert(`Submission failed! The server responded with: ${result.error || 'Unknown error'}`);
        return false;
      }
    } catch (error: any) {
      console.error("Fetch API (POST) error:", error.message);
      alert(
        `Could not send data: ${error.message}\n\n` +
        `This could be a network issue or a problem with the Google Apps Script configuration.`
      );
      return false;
    }
  }

  private async fetchSheetData(dataType: string, isPollingUpdate = false): Promise<any[] | null> {
    if (!this.settingsService.areSettingsConfigured()) {
      if (!isPollingUpdate) {
        // Suppress alert for initial load, as mock data will be used.
        console.log('Application not configured. Will use mock data if available.');
      }
      return null;
    }

    const payload = {
      appToken: this.settingsService.securityToken(),
      dataType: dataType,
      action: 'getData'
    };

    try {
      const result = await this.performFetchWithTimeout(payload);

      if (result.result === 'success' && Array.isArray(result.data)) {
        return result.data;
      } else {
        const errorMsg = `Server logic error fetching ${dataType}: ${result.error || 'The script returned a failure status.'}`;
        console.error(errorMsg);
        if (!isPollingUpdate) {
          alert(`Could not retrieve data for ${dataType}. The server responded with an error: ${result.error || 'Unknown error'}`);
        }
        return null;
      }
    } catch (error: any) {
      const errorMsg = `Fetch API (GET via POST) error for ${dataType}: ${error.message}`;
      console.error(errorMsg);
      if (!isPollingUpdate) {
        alert(
          `Failed to fetch data: ${error.message}\n\n` +
          `This is often due to the Google Apps Script's deployment settings. Please ensure 'Who has access' is set to 'Anyone'.`
        );
      }
      return null;
    }
  }
  
  // --- DATA LOADING METHODS ---
  async loadUsers(isPollingUpdate = false): Promise<void> {
    const data = await this.fetchSheetData('USER_CREDENTIALS', isPollingUpdate);
    if (data) {
      // Avoid unnecessary signal updates if the data hasn't changed.
      if (JSON.stringify(this._users()) !== JSON.stringify(data)) {
        this._users.set(data as User[]);
      }
      this.usersLastUpdated.set(new Date());
    }
  }

  async loadOrders(): Promise<void> {
    const data = await this.fetchSheetData('JOB_QUEUE');
    if (data) {
      const orders: Order[] = data.map((row: any) => ({
        ...row,
        createdAt: new Date(row.createdAt), // Ensure dates are Date objects
        completedAt: row.completedAt ? new Date(row.completedAt) : undefined
      }));
      this._orders.set(orders);
    }
  }
  
  async loadTasks(): Promise<void> {
    const data = await this.fetchSheetData('TASK_LIST'); // Assumed dataType
    if (data) {
      const tasks: Task[] = data.map((row: any) => ({
        ...row,
        dueDate: new Date(row.dueDate),
        createdAt: new Date(row.createdAt),
      }));
      this._tasks.set(tasks);
    }
  }

  // --- DATA GETTERS ---
  getUserById(id: string): User | undefined { return this.users().find(u => u.id === id); }
  getOrderById(id: string): Order | undefined { return this.orders().find(o => o.id === id); }
  getTaskById(id: string): Task | undefined { return this.tasks().find(t => t.id === id); }
  getUserByName(name: string): User | undefined { return this.users().find(u => u.name.toLowerCase() === name.toLowerCase()); }

  // --- ORDER MANAGEMENT ---
  async addOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<void> {
    if (await this.sendDataToScript(order, 'ADD_ORDER')) {
      await this.loadOrders();
    }
  }

  async updateOrder(updatedOrder: Order): Promise<void> {
    if (await this.sendDataToScript(updatedOrder, 'UPDATE_ORDER')) {
      await this.loadOrders();
    }
  }
  
  async deleteOrder(id: string): Promise<void> {
    if (await this.sendDataToScript({ id }, 'DELETE_ORDER')) {
      await this.loadOrders();
    }
  }

  // --- TASK MANAGEMENT ---
  async addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<void> {
    if (await this.sendDataToScript(task, 'ADD_TASK')) {
      await this.loadTasks();
    }
  }

  async updateTask(updatedTask: Task): Promise<void> {
    if (await this.sendDataToScript(updatedTask, 'UPDATE_TASK')) {
      await this.loadTasks();
    }
  }

  async deleteTask(id: string): Promise<void> {
    if (await this.sendDataToScript({ id }, 'DELETE_TASK')) {
      await this.loadTasks();
    }
  }

  // --- USER MANAGEMENT ---
  async addUser(user: Omit<User, 'id'>): Promise<void> {
    if (await this.sendDataToScript(user, 'ADD_USER')) {
      await this.loadUsers();
    }
  }

  async updateUser(updatedUser: User): Promise<void> {
    if (await this.sendDataToScript(updatedUser, 'UPDATE_USER')) {
      await this.loadUsers();
    }
  }

  async deleteUser(id: string): Promise<void> {
    if (await this.sendDataToScript({ id }, 'DELETE_USER')) {
      await this.loadUsers();
    }
  }
  
  // --- POLLING METHODS ---
  startUserPolling(): void {
    if (this.userPollingInterval) return; // Already polling

    // The initial data is already fetched by loadInitialData.
    // We start the interval to check for updates.
    this.userPollingInterval = setInterval(() => {
      this.loadUsers(true); // `true` indicates a silent polling update
    }, 15000); // Poll every 15 seconds
  }

  stopUserPolling(): void {
    if (this.userPollingInterval) {
      clearInterval(this.userPollingInterval);
      this.userPollingInterval = null;
    }
  }
}
