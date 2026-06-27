import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ResumeResponseDto,
  AnalyzeRequestDto,
  AnalyzeResponseDto,
  OptimizeRequestDto,
  OptimizeResponseDto,
  Answer,
} from './index.schema';

@Injectable({
  providedIn: 'root',
})
export class AnalyzerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadResume(file: File, fileName: string): Observable<ResumeResponseDto> {
    const payload = new FormData();
    payload.append('file', file, fileName);
    return this.http.post<ResumeResponseDto>(`${this.apiUrl}/resumes`, payload);
  }

  analyze(
    resumeContent: string,
    jobDescription: string,
  ): Observable<AnalyzeResponseDto> {
    const payload: AnalyzeRequestDto = { resumeContent, jobDescription };
    return this.http.post<AnalyzeResponseDto>(
      `${this.apiUrl}/ats/analyze`,
      payload,
    );
  }

  optimize(
    resumeContent: string,
    jobDescription: string,
    answers: Answer[],
  ): Observable<OptimizeResponseDto> {
    const payload: OptimizeRequestDto = {
      resumeContent,
      jobDescription,
      answers,
    };
    return this.http.post<OptimizeResponseDto>(
      `${this.apiUrl}/ats/optimize`,
      payload,
    );
  }
}
