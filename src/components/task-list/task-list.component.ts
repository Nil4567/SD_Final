
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DataService, Task } from '../../services/data.service';
import { RouterLink } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';

type TaskStatus = 'Open' | 'In Progress' | 'Done';

@Component({
  selector: 'app-task-list',
  host: {
    class: 'block'
  },
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, CommonModule]
})
export class TaskListComponent {
  private dataService: DataService = inject(DataService);

  tasks = this.dataService.tasks;
  users = this.dataService.users;
  loading = this.dataService.loading;

  getUserName(userId?: string): string {
    return userId ? (this.users().find(u => u.id === userId)?.name || 'N/A') : 'Unassigned';
  }

  async deleteTask(taskId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this task? This action will be saved to the backend.')) {
      await this.dataService.deleteTask(taskId);
    }
  }

  async updateTaskStatus(task: Task, event: Event): Promise<void> {
    const newStatus = (event.target as HTMLSelectElement).value as TaskStatus;
    if (task.status !== newStatus) {
      const updatedTask = { ...task, status: newStatus };
      await this.dataService.updateTask(updatedTask);
    }
  }
}