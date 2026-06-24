import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Question, Answer, OptimizeResponseDto } from '../index.schema';

@Component({
  selector: 'app-analyzer-optimize',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './index.component.html',
  styleUrls: []
})
export class OptimizeComponent implements OnInit {
  @Input() questions: Question[] = [];
  @Input() optimizeResult: OptimizeResponseDto | null = null;
  @Output() answersSubmit = new EventEmitter<Answer[]>();
  @Output() restart = new EventEmitter<void>();

  userAnswers: { [tag: string]: string } = {};
  isLoading = false;

  ngOnInit(): void {
    this.initializeAnswers();
  }

  ngOnChanges(): void {
    this.initializeAnswers();
  }

  private initializeAnswers(): void {
    if (this.questions) {
      this.questions.forEach(q => {
        if (this.userAnswers[q.tag] === undefined) {
          this.userAnswers[q.tag] = '';
        }
      });
    }
  }

  getPlaceholder(tag: string): string {
    return `Ex: Fale um pouco sobre seu conhecimento prático em ${tag.toLowerCase()}...`;
  }

  onSubmit(): void {
    this.isLoading = true;
    const answers: Answer[] = this.questions.map(q => ({
      tag: q.tag,
      question: q.text,
      answer: this.userAnswers[q.tag] || ''
    }));
    this.answersSubmit.emit(answers);
  }

  downloadResume(): void {
    if (this.optimizeResult?.optimizedContent) {
      const blob = new Blob([this.optimizeResult.optimizedContent], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'curriculo_otimizado.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  onRestartClick(): void {
    this.restart.emit();
  }
}
