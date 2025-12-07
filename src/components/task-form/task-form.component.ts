

import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DataService, Task, User } from '../../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-form',
  host: {
    class: 'block p-6 bg-white rounded-lg shadow-md'
  },
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule]
})
export class TaskFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private dataService: DataService = inject(DataService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  taskForm!: FormGroup;
  isEditMode = false;
  taskId: string | null = null;
  users = this.dataService.users;
  isSaving = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.taskId = this.route.snapshot.paramMap.get('id');
    if (this.taskId) {
      this.isEditMode = true;
      const task = this.dataService.getTaskById(this.taskId);
      if (task) {
        this.taskForm.patchValue({
          description: task.description,
          assignedToUserId: task.assignedToUserId || '',
          dueDate: task.dueDate.toISOString().substring(0, 10),
          status: task.status,
          priority: task.priority
        });
      } else {
        console.error('Task not found for ID:', this.taskId);
        this.router.navigate(['/tasks']);
      }
    }
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      description: ['', Validators.required],
      assignedToUserId: [''],
      dueDate: ['', Validators.required],
      status: ['Open', Validators.required],
      priority: ['Medium', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    
    this.isSaving.set(true);

    try {
      const formValue = this.taskForm.value;
      const taskData = {
        description: formValue.description,
        assignedToUserId: formValue.assignedToUserId || undefined,
        dueDate: new Date(formValue.dueDate),
        status: formValue.status,
        priority: formValue.priority
      };

      if (this.isEditMode && this.taskId) {
        const currentTask = this.dataService.getTaskById(this.taskId);
        if (currentTask) {
          await this.dataService.updateTask({ ...currentTask, ...taskData });
        }
      } else {
        await this.dataService.addTask(taskData as Omit<Task, 'id' | 'createdAt'>);
      }
      this.router.navigate(['/tasks']);
    } catch (error) {
      console.error("Failed to save task:", error);
      alert("There was an error saving the task. Please try again.");
      this.isSaving.set(false);
    }
  }

  get formControl() {
    return this.taskForm.controls;
  }
}