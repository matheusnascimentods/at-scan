import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AnalyzerService } from './index.service';
import { environment } from '../../../environments/environment';

describe('AnalyzerService', () => {
  let service: AnalyzerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnalyzerService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AnalyzerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload resume', () => {
    const mockResponse = { id: 'uuid-123', content: 'markdown content', createdAt: '2026-06-23' };
    service.uploadResume(new File(['pdf-content'], 'test.pdf', { type: 'application/pdf' }), 'test.pdf').subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/resumes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect(req.request.body.get('file')).toEqual(jasmine.any(File));
    req.flush(mockResponse);
  });

  it('should analyze resume', () => {
    const mockResponse = {
      id: 'analysis-uuid-123',
      score: 75,
      breakdown: { keywordsScore: 80, semanticScore: 70, formatScore: 90, sectionScore: 60 },
      matchedKeywords: [],
      missingKeywords: [],
      formatIssues: [],
      recommendations: [],
      questions: []
    };

    service.analyze(
      'resume-uuid-123',
      'resume-content-min-100-characters-xyz-abc-def-ghi-jkl-mno-pqr-stu-vwx-yz-123-456-789-000',
      'job-description-min-50-characters-abc-def-ghi-jkl-mno'
    ).subscribe(res => {
      expect(res).toEqual(mockResponse as any);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/ats/analyze`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      resumeId: 'resume-uuid-123',
      resumeContent: 'resume-content-min-100-characters-xyz-abc-def-ghi-jkl-mno-pqr-stu-vwx-yz-123-456-789-000',
      jobDescription: 'job-description-min-50-characters-abc-def-ghi-jkl-mno'
    });
    req.flush(mockResponse);
  });

  it('should optimize resume', () => {
    const mockResponse = {
      id: 'optimization-uuid-123',
      previousScore: 75,
      newScore: 85,
      gain: 10,
      optimizedContent: 'optimized content',
      changes: []
    };

    service.optimize('analysis-uuid-123', []).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/ats/optimize`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      analysisId: 'analysis-uuid-123',
      answers: []
    });
    req.flush(mockResponse);
  });
});
