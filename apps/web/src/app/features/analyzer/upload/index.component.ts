import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analyzer-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './index.component.html',
  styleUrls: [],
})
export class UploadComponent {
  @Output() fileSelected = new EventEmitter<{ file: File; fileName: string }>();

  fileName: string | null = null;
  file: File | null = null;
  errorMessage: string | null = null;
  isDragOver = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    this.errorMessage = null;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    this.errorMessage = null;
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  private handleFile(file: File): void {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      this.errorMessage = 'Apenas arquivos PDF são permitidos.';
      this.fileName = null;
      this.file = null;
      return;
    }
    this.file = file;
    this.fileName = file.name;
  }

  onNext(): void {
    if (this.file && this.fileName) {
      this.fileSelected.emit({
        file: this.file,
        fileName: this.fileName,
      });
    }
  }
}
