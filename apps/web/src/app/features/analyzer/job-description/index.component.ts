import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-analyzer-job-description',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './index.component.html',
  styleUrls: []
})
export class JobDescriptionComponent {
  @Output() back = new EventEmitter<void>();
  @Output() jobDescriptionSubmit = new EventEmitter<string>();

  jobDescription = '';
  isLoading = false;

  onSubmit(): void {
    if (this.jobDescription.trim().length >= 50) {
      this.isLoading = true;
      this.jobDescriptionSubmit.emit(this.jobDescription);
    }
  }

  onBackClick(): void {
    this.back.emit();
  }
}
