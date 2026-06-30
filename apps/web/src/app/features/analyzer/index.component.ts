import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadComponent } from './upload/index.component';
import { JobDescriptionComponent } from './job-description/index.component';
import { ResultComponent } from './result/index.component';
import { OptimizeComponent } from './optimize/index.component';
import { AnalyzerService } from './index.service';
import { AnalyzeResponseDto, OptimizeResponseDto, Answer } from './index.schema';

@Component({
  selector: 'app-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    UploadComponent,
    JobDescriptionComponent,
    ResultComponent,
    OptimizeComponent
  ],
  templateUrl: './index.component.html',
  styleUrls: []
})
export class AnalyzerComponent {
  activeStep = 0; // 0: Upload, 1: Job Description, 2: Result, 3: Optimize
  
  resumeContent = '';
  resumeId = '';
  jobDescription = '';
  
  analyzeResult: AnalyzeResponseDto | null = null;
  optimizeResult: OptimizeResponseDto | null = null;
  
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private analyzerService: AnalyzerService) {}

  private getErrorMessage(err: any, fallback: string): string {
    if (err && err.error) {
      if (typeof err.error.message === 'string') {
        return err.error.message;
      }
      if (Array.isArray(err.error.message)) {
        return err.error.message.join(', ');
      }
      if (typeof err.error === 'string') {
        return err.error;
      }
    }
    return fallback;
  }

  onFileSelected(event: { file: File; fileName: string }): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.analyzerService.uploadResume(event.file, event.fileName).subscribe({
      next: (res) => {
        this.resumeId = res.id;
        this.resumeContent = res.content;
        this.isLoading = false;
        this.activeStep = 1; // Advance to Job Description
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err, 'Erro ao processar o currículo. Verifique se o arquivo PDF está legível.');
        console.error(err);
      }
    });
  }

  onJobDescriptionSubmit(jobDescription: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.jobDescription = jobDescription;

    this.analyzerService.analyze(this.resumeId, this.resumeContent, this.jobDescription).subscribe({
      next: (res) => {
        this.analyzeResult = res;
        this.isLoading = false;
        this.activeStep = 2; // Advance to Results
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err, 'Erro ao realizar a análise ATS. Tente novamente.');
        console.error(err);
      }
    });
  }

  onOptimize(): void {
    this.activeStep = 3; // Advance to Optimize Interative Questions
  }

  onAnswersSubmit(answers: Answer[]): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Filter empty answers out before sending to the backend optimizer agent (as per CLAUDE.md lines 491-492)
    const filledAnswers = answers.filter(a => a.answer && a.answer.trim() !== '');

    this.analyzerService.optimize(this.analyzeResult?.id ?? '', filledAnswers).subscribe({
      next: (res) => {
        this.optimizeResult = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err, 'Erro ao otimizar o currículo. Tente novamente.');
        console.error(err);
      }
    });
  }

  onBack(): void {
    if (this.activeStep > 0) {
      this.activeStep--;
    }
  }

  onRestart(): void {
    this.activeStep = 0;
    this.resumeContent = '';
    this.resumeId = '';
    this.jobDescription = '';
    this.analyzeResult = null;
    this.optimizeResult = null;
    this.errorMessage = null;
  }
}
