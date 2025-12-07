import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { CommonModule } from '@angular/common';
import { AppsScriptGuideComponent } from '../apps-script-guide/apps-script-guide.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule, AppsScriptGuideComponent],
})
export class SettingsComponent implements OnInit {
  // FIX: Explicitly type the injected `FormBuilder` to resolve a type inference issue.
  private fb: FormBuilder = inject(FormBuilder);
  private settingsService = inject(SettingsService);

  settingsForm!: FormGroup;
  saveStatus = signal<'idle' | 'success' | 'error'>('idle');
  showGuide = signal(false);

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      scriptUrl: [this.settingsService.scriptUrl() || '', [Validators.required]],
      securityToken: [this.settingsService.securityToken() || '', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.settingsForm.valid) {
      const { scriptUrl, securityToken } = this.settingsForm.value;
      this.settingsService.saveSettings(scriptUrl, securityToken);
      this.saveStatus.set('success');
      setTimeout(() => this.saveStatus.set('idle'), 3000);
    } else {
        this.saveStatus.set('error');
        this.settingsForm.markAllAsTouched();
    }
  }

  toggleGuide(): void {
    this.showGuide.update(value => !value);
  }

  get formControl() {
    return this.settingsForm.controls;
  }
}
