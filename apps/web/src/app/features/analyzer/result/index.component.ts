import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzeResponseDto } from '../index.schema';

@Component({
  selector: 'app-analyzer-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './index.component.html',
  styleUrls: []
})
export class ResultComponent {
  @Input() analyzeResult: AnalyzeResponseDto | null = null;
  @Output() optimize = new EventEmitter<void>();

  get scoreColorClass(): string {
    const score = this.analyzeResult?.score ?? 0;
    if (score < 50) return 'text-rose-500 border-rose-500 bg-rose-50';
    if (score < 75) return 'text-amber-500 border-amber-500 bg-amber-50';
    return 'text-emerald-500 border-emerald-500 bg-emerald-50';
  }

  get scoreRingColorClass(): string {
    const score = this.analyzeResult?.score ?? 0;
    if (score < 50) return 'border-rose-500';
    if (score < 75) return 'border-amber-500';
    return 'border-emerald-500';
  }

  getPriorityColorClass(priority: 'Alta' | 'Média' | 'Baixa' | string): string {
    switch (priority) {
      case 'Alta':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Média':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Baixa':
        return 'bg-slate-50 text-slate-700 border-slate-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  }

  onOptimizeClick(): void {
    this.optimize.emit();
  }
}
