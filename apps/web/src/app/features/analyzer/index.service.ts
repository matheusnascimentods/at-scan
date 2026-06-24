import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProcessResumeDto,
  ResumeResponseDto,
  AnalyzeRequestDto,
  AnalyzeResponseDto,
  OptimizeRequestDto,
  OptimizeResponseDto,
  Answer
} from './index.schema';

@Injectable({
  providedIn: 'root'
})
export class AnalyzerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadResume(fileBase64: string, fileName: string): Observable<ResumeResponseDto> {
    const payload: ProcessResumeDto = { fileBase64, fileName };
    return this.http.post<ResumeResponseDto>(`${this.apiUrl}/resumes`, payload);
  }

  analyze(resumeContent: string, jobDescription: string): Observable<AnalyzeResponseDto> {
    const payload: AnalyzeRequestDto = { resumeContent, jobDescription };
    return this.http.post<AnalyzeResponseDto>(`${this.apiUrl}/ats/analyze`, payload);
  }

  optimize(resumeContent: string, jobDescription: string, answers: Answer[]): Observable<OptimizeResponseDto> {
    const payload: OptimizeRequestDto = { resumeContent, jobDescription, answers };
    return this.http.post<OptimizeResponseDto>(`${this.apiUrl}/ats/optimize`, payload);
  }
}
