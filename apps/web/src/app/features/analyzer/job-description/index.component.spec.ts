import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobDescriptionComponent } from './index.component';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

describe('JobDescriptionComponent', () => {
  let component: JobDescriptionComponent;
  let fixture: ComponentFixture<JobDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, JobDescriptionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(JobDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with counter at 0 characters', () => {
    const counter = fixture.debugElement.query(By.css('div.flex.justify-between.text-xs span:last-child'));
    expect(counter.nativeElement.textContent).toContain('0 caracteres');
  });

  it('should update counter when input changes', async () => {
    component.jobDescription = 'a'.repeat(120);
    fixture.detectChanges();
    await fixture.whenStable();

    const counter = fixture.debugElement.query(By.css('div.flex.justify-between.text-xs span:last-child'));
    expect(counter.nativeElement.textContent).toContain('120 caracteres');
  });

  it('should have submit button disabled if empty', () => {
    const submitBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#FFC300\\]'));
    expect(submitBtn.nativeElement.disabled).toBeTrue();
  });

  it('should enable submit button when description is >= 50 characters', async () => {
    component.jobDescription = 'a'.repeat(50);
    fixture.detectChanges();
    await fixture.whenStable();

    const submitBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#FFC300\\]'));
    expect(submitBtn.nativeElement.disabled).toBeFalse();
  });

  it('should enter loading state on submit click', () => {
    component.jobDescription = 'a'.repeat(50);
    fixture.detectChanges();

    const submitBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#FFC300\\]'));
    submitBtn.nativeElement.click();
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    expect(submitBtn.nativeElement.disabled).toBeTrue();
    expect(submitBtn.nativeElement.textContent).toContain('Analisando...');
  });

  it('should emit back event when clicking back button', () => {
    let emitted = false;
    component.back.subscribe(() => {
      emitted = true;
    });

    const backBtn = fixture.debugElement.query(By.css('button.border-slate-200'));
    backBtn.nativeElement.click();

    expect(emitted).toBeTrue();
  });

  it('should emit jobDescriptionSubmit event when clicking submit button', (done) => {
    const text = 'a'.repeat(50);
    component.jobDescription = text;
    fixture.detectChanges();

    component.jobDescriptionSubmit.subscribe(val => {
      expect(val).toBe(text);
      done();
    });

    const submitBtn = fixture.debugElement.query(By.css('button.bg-\\[\\#FFC300\\]'));
    submitBtn.nativeElement.click();
  });
});
