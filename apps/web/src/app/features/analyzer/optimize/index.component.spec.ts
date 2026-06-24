import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OptimizeComponent } from './index.component';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Question, OptimizeResponseDto } from '../index.schema';

describe('OptimizeComponent', () => {
  let component: OptimizeComponent;
  let fixture: ComponentFixture<OptimizeComponent>;

  const mockQuestions: Question[] = [
    { tag: 'Orquestração de Containers', text: 'Você tem experiência com Kubernetes?' },
    { tag: 'Cache & Performance', text: 'Já utilizou Redis ou alguma solução de cache?' }
  ];

  const mockOptimizeResult: OptimizeResponseDto = {
    previousScore: 73,
    newScore: 91,
    gain: 18,
    optimizedContent: 'Markdown content optimized',
    changes: [
      { section: 'Experiência Profissional', description: 'Adicionada menção a Docker Swarm' },
      { section: 'Habilidades Técnicas', description: 'Adicionado Redis e Kubernetes' }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, OptimizeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OptimizeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render all questions at once', () => {
    component.questions = mockQuestions;
    fixture.detectChanges();

    const questionCards = fixture.debugElement.queryAll(By.css('div.border-l-4'));
    expect(questionCards.length).toBe(2);
  });

  it('should render correct numbered badge and tag pill per card', () => {
    component.questions = mockQuestions;
    fixture.detectChanges();

    const numberedBadges = fixture.debugElement.queryAll(By.css('.text-slate-400'));
    const tagPills = fixture.debugElement.queryAll(By.css('.bg-blue-50'));

    expect(numberedBadges[0].nativeElement.textContent.trim()).toBe('Pergunta 01');
    expect(numberedBadges[1].nativeElement.textContent.trim()).toBe('Pergunta 02');

    expect(tagPills[0].nativeElement.textContent.trim()).toBe('Orquestração de Containers');
    expect(tagPills[1].nativeElement.textContent.trim()).toBe('Cache & Performance');
  });

  it('should render correct placeholder for textarea', () => {
    component.questions = mockQuestions;
    fixture.detectChanges();

    const textareas = fixture.debugElement.queryAll(By.css('textarea'));
    expect(textareas[0].nativeElement.placeholder).toContain('orquestração de containers');
    expect(textareas[1].nativeElement.placeholder).toContain('cache & performance');
  });

  it('should keep generate button enabled even with all inputs empty', () => {
    component.questions = mockQuestions;
    fixture.detectChanges();

    const submitBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#003566\\]'));
    expect(submitBtn.nativeElement.disabled).toBeFalse();
  });

  it('should emit answersSubmit with correct array including empty/filled answers on submit', (done) => {
    component.questions = mockQuestions;
    fixture.detectChanges();

    component.userAnswers['Orquestração de Containers'] = 'Sim, trabalhei com Kubernetes.';
    fixture.detectChanges();

    component.answersSubmit.subscribe(answers => {
      expect(answers.length).toBe(2);
      expect(answers[0]).toEqual({
        tag: 'Orquestração de Containers',
        question: 'Você tem experiência com Kubernetes?',
        answer: 'Sim, trabalhei com Kubernetes.'
      });
      expect(answers[1]).toEqual({
        tag: 'Cache & Performance',
        question: 'Já utilizou Redis ou alguma solução de cache?',
        answer: ''
      });
      done();
    });

    const submitBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#003566\\]'));
    submitBtn.nativeElement.click();
  });

  it('should enter loading state upon submit click', () => {
    component.questions = mockQuestions;
    fixture.detectChanges();

    const submitBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#003566\\]'));
    submitBtn.nativeElement.click();
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    expect(submitBtn.nativeElement.disabled).toBeTrue();
    expect(submitBtn.nativeElement.textContent).toContain('Gerando');
  });

  it('should render comparative dashboard, gain, changes and success banner when result input is supplied', () => {
    component.optimizeResult = mockOptimizeResult;
    fixture.detectChanges();

    const successBanner = fixture.debugElement.query(By.css('.bg-emerald-50'));
    expect(successBanner).toBeTruthy();

    const scores = fixture.debugElement.queryAll(By.css('.rounded-full.border-4'));
    expect(scores[0].nativeElement.textContent.trim()).toBe('73'); // previous
    expect(scores[1].nativeElement.textContent.trim()).toBe('91'); // new

    const gainBadge = fixture.debugElement.query(By.css('.text-emerald-700'));
    expect(gainBadge.nativeElement.textContent.trim()).toBe('+18 pts');

    const changes = fixture.debugElement.queryAll(By.css('div.bg-slate-50\\/50'));
    expect(changes.length).toBe(2);
    expect(changes[0].nativeElement.textContent).toContain('Experiência Profissional');
    expect(changes[0].nativeElement.textContent).toContain('Adicionada menção a Docker Swarm');
  });

  it('should trigger download when clicking download button', () => {
    component.optimizeResult = mockOptimizeResult;
    fixture.detectChanges();

    spyOn(component, 'downloadResume');

    const downloadBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#003566\\]'));
    downloadBtn.nativeElement.click();

    expect(component.downloadResume).toHaveBeenCalled();
  });

  it('should emit restart event when clicking restart button', () => {
    component.optimizeResult = mockOptimizeResult;
    fixture.detectChanges();

    let emitted = false;
    component.restart.subscribe(() => {
      emitted = true;
    });

    const restartBtn = fixture.debugElement.query(By.css('button.border-slate-200'));
    restartBtn.nativeElement.click();

    expect(emitted).toBeTrue();
  });
});
