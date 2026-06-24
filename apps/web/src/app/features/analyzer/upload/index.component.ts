import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analyzer-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './index.component.html',
  styleUrls: []
})
export class UploadComponent {
  @Output() fileSelected = new EventEmitter<{ fileBase64: string; fileName: string }>();

  fileName: string | null = null;
  fileBase64: string | null = null;
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
      this.fileBase64 = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Get only the base64 part, removing "data:application/pdf;base64,"
      const base64Data = result.split(',')[1];
      this.fileBase64 = base64Data;
      this.fileName = file.name;
    };
    reader.onerror = () => {
      this.errorMessage = 'Erro ao ler o arquivo currículo.';
      this.fileName = null;
      this.fileBase64 = null;
    };
    reader.readAsDataURL(file);
  }

  onNext(): void {
    if (this.fileBase64 && this.fileName) {
      this.fileSelected.emit({
        fileBase64: this.fileBase64,
        fileName: this.fileName
      });
    }
  }
}
