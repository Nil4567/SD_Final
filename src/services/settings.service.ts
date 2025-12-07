
import { Injectable, signal, computed } from '@angular/core';

const SCRIPT_URL_KEY = 'sv_script_url';
const SECURITY_TOKEN_KEY = 'sv_security_token';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  scriptUrl = signal<string | null>(null);
  securityToken = signal<string | null>(null);

  areSettingsConfigured = computed(() => !!this.scriptUrl() && !!this.securityToken());

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    this.scriptUrl.set(localStorage.getItem(SCRIPT_URL_KEY));
    this.securityToken.set(localStorage.getItem(SECURITY_TOKEN_KEY));
  }

  saveSettings(url: string, token: string): void {
    localStorage.setItem(SCRIPT_URL_KEY, url);
    localStorage.setItem(SECURITY_TOKEN_KEY, token);
    this.scriptUrl.set(url);
    this.securityToken.set(token);
  }
}
