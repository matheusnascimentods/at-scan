import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyzerComponent } from './index.component';
import { AnalyzerService } from './index.service';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('AnalyzerComponent', () => {
  let component: AnalyzerComponent;
  let fixture: ComponentFixture<AnalyzerComponent>;
  let mockService: jasmine.SpyObj<AnalyzerService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('AnalyzerService', [
      'uploadResume',
      'analyze',
      'optimize',
    ]);

    await TestBed.configureTestingModule({
      imports: [AnalyzerComponent],
      providers: [{ provide: AnalyzerService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyzerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have activeStep === 0 initially', () => {
    fixture.detectChanges();
    expect(component.activeStep).toBe(0);
  });

  it('should advance to step 1 and save resume content when file is selected successfully', () => {
    const mockUploadResponse = {
      id: 'uuid-123',
      content: 'resume markdown content',
      createdAt: '2026',
    };
    mockService.uploadResume.and.returnValue(of(mockUploadResponse));

    const file = new File(['pdf-content'], 'cv.pdf', {
      type: 'application/pdf',
    });

    fixture.detectChanges();
    component.onFileSelected({ file, fileName: 'cv.pdf' });

    expect(mockService.uploadResume).toHaveBeenCalledWith(file, 'cv.pdf');
    expect(component.resumeId).toBe('uuid-123');
    expect(component.resumeContent).toBe('resume markdown content');
    expect(component.activeStep).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle upload error', () => {
    mockService.uploadResume.and.returnValue(
      throwError(() => new Error('Upload error')),
    );

    const file = new File(['pdf-content'], 'cv.pdf', {
      type: 'application/pdf',
    });

    fixture.detectChanges();
    component.onFileSelected({ file, fileName: 'cv.pdf' });

    expect(component.errorMessage).toContain('Erro ao processar');
    expect(component.isLoading).toBeFalse();
    expect(component.activeStep).toBe(0);
  });

  it('should advance to step 2 and store analysis results when job description is submitted', () => {
    const mockAnalyzeResponse = {
      id: 'analysis-uuid-123',
      score: 73,
      breakdown: {
        keywordsScore: 80,
        semanticScore: 68,
        formatScore: 90,
        sectionScore: 55,
      },
      matchedKeywords: ['Python'],
      missingKeywords: ['Redis'],
      formatIssues: [],
      recommendations: [],
      questions: [],
    };
    mockService.analyze.and.returnValue(of(mockAnalyzeResponse));

    fixture.detectChanges();
    component.resumeId = 'resume-uuid-123';
    component.resumeContent = 'my resume markdown';
    component.onJobDescriptionSubmit(
      'Job requirements text for developer position...',
    );

    expect(mockService.analyze).toHaveBeenCalledWith(
      'resume-uuid-123',
      'my resume markdown',
      'Job requirements text for developer position...',
    );
    expect(component.analyzeResult).toEqual(mockAnalyzeResponse);
    expect(component.activeStep).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('should advance to step 3 when optimize is called', () => {
    fixture.detectChanges();
    component.activeStep = 2;
    component.onOptimize();

    expect(component.activeStep).toBe(3);
  });

  it('should call optimize and filter empty answers when submitting optimize answers', () => {
    const mockOptimizeResponse = {
      id: 'optimization-uuid-123',
      previousScore: 73,
      newScore: 91,
      gain: 18,
      optimizedContent: 'new markdown',
      changes: [],
    };
    mockService.optimize.and.returnValue(of(mockOptimizeResponse));

    fixture.detectChanges();
    component.analyzeResult = { id: 'analysis-uuid-123' } as any;

    const answers = [
      { tag: 'docker', question: 'Q1', answer: 'Yes' },
      { tag: 'redis', question: 'Q2', answer: '  ' },
      { tag: 'kubernetes', question: 'Q3', answer: '' },
    ];

    component.onAnswersSubmit(answers);

    expect(mockService.optimize).toHaveBeenCalledWith('analysis-uuid-123', [
      { tag: 'docker', question: 'Q1', answer: 'Yes' },
    ]);
    expect(component.optimizeResult).toEqual(mockOptimizeResponse);
    expect(component.isLoading).toBeFalse();
  });

  it('should decrement activeStep when onBack is called', () => {
    fixture.detectChanges();
    component.activeStep = 2;
    component.onBack();
    expect(component.activeStep).toBe(1);
  });

  it('should reset state when onRestart is called', () => {
    fixture.detectChanges();
    component.activeStep = 3;
    component.resumeId = 'uuid';
    component.resumeContent = 'content';
    component.jobDescription = 'job';
    component.analyzeResult = {} as any;
    component.optimizeResult = {} as any;

    component.onRestart();

    expect(component.activeStep).toBe(0);
    expect(component.resumeId).toBe('');
    expect(component.resumeContent).toBe('');
    expect(component.jobDescription).toBe('');
    expect(component.analyzeResult).toBeNull();
    expect(component.optimizeResult).toBeNull();
  });
});
