import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultComponent } from './index.component';
import { By } from '@angular/platform-browser';
import { AnalyzeResponseDto } from '../index.schema';

describe('ResultComponent', () => {
  let component: ResultComponent;
  let fixture: ComponentFixture<ResultComponent>;

  const mockResult: AnalyzeResponseDto = {
    id: 'analysis-uuid-123',
    score: 73,
    breakdown: {
      keywordsScore: 80,
      semanticScore: 68,
      formatScore: 90,
      sectionScore: 55
    },
    matchedKeywords: ['Python', 'Docker'],
    missingKeywords: ['Kubernetes', 'Redis'],
    formatIssues: [
      'Evite tabelas — parsers ATS não leem corretamente',
      'Informações de contato no rodapé — mova para o topo'
    ],
    recommendations: [
      { priority: 'Alta', text: 'Adicione experiência com Kubernetes', impact: '+6 pontos' },
      { priority: 'Média', text: 'Mencione pipelines de CI/CD', impact: '+3 pontos' },
      { priority: 'Baixa', text: 'Adicione TypeScript à lista de linguagens', impact: '+2 pontos' }
    ],
    questions: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ResultComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display the score value correctly', () => {
    component.analyzeResult = mockResult;
    fixture.detectChanges();

    const scoreValue = fixture.debugElement.query(By.css('.text-5xl'));
    expect(scoreValue.nativeElement.textContent).toBe('73');
  });

  it('should apply correct color class based on score threshold', () => {
    component.analyzeResult = { ...mockResult, score: 45 };
    fixture.detectChanges();
    expect(component.scoreRingColorClass).toBe('border-rose-500');

    component.analyzeResult = { ...mockResult, score: 65 };
    fixture.detectChanges();
    expect(component.scoreRingColorClass).toBe('border-amber-500');

    component.analyzeResult = { ...mockResult, score: 85 };
    fixture.detectChanges();
    expect(component.scoreRingColorClass).toBe('border-emerald-500');
  });

  it('should render progress bars with proportional width', () => {
    component.analyzeResult = mockResult;
    fixture.detectChanges();

    const progressFills = fixture.debugElement.queryAll(By.css('.h-full.rounded-full'));
    // keywordsScore is 80% (first bar)
    expect(progressFills[0].nativeElement.style.width).toBe('80%');
  });

  it('should render matched and missing keyword chips', () => {
    component.analyzeResult = mockResult;
    fixture.detectChanges();

    const greenChips = fixture.debugElement.queryAll(By.css('.flex.flex-wrap.gap-2 span.bg-emerald-50'));
    const redChips = fixture.debugElement.queryAll(By.css('.flex.flex-wrap.gap-2 span.bg-rose-50'));

    expect(greenChips.length).toBe(2);
    expect(redChips.length).toBe(2);

    expect(greenChips[0].nativeElement.textContent).toContain('Python');
    expect(redChips[0].nativeElement.textContent).toContain('Kubernetes');
  });


  it('should list format issues as bullets', () => {
    component.analyzeResult = mockResult;
    fixture.detectChanges();

    const bullets = fixture.debugElement.queryAll(By.css('li'));
    expect(bullets.length).toBe(2);
    expect(bullets[0].nativeElement.textContent).toContain('Evite tabelas');
  });

  it('should order recommendations and assign correct colors', () => {
    component.analyzeResult = mockResult;
    fixture.detectChanges();

    const priorityBadges = fixture.debugElement.queryAll(By.css('.uppercase.shrink-0'));
    expect(priorityBadges[0].nativeElement.textContent.trim()).toBe('Alta');
    expect(priorityBadges[1].nativeElement.textContent.trim()).toBe('Média');
    expect(priorityBadges[2].nativeElement.textContent.trim()).toBe('Baixa');

    expect(component.getPriorityColorClass('Alta')).toContain('bg-rose-50');
    expect(component.getPriorityColorClass('Média')).toContain('bg-amber-50');
    expect(component.getPriorityColorClass('Baixa')).toContain('bg-slate-50');
  });

  it('should emit optimize event when clicking optimize button', () => {
    component.analyzeResult = mockResult;
    fixture.detectChanges();

    let emitted = false;
    component.optimize.subscribe(() => {
      emitted = true;
    });

    const optimizeBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#003566\\]'));
    optimizeBtn.nativeElement.click();

    expect(emitted).toBeTrue();
  });
});
