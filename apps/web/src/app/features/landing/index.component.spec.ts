import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LandingComponent } from './index.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the landing component', () => {
    expect(component).toBeTruthy();
  });

  it('should render headline correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1Text = compiled.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(h1Text).toContain('Sua vaga. Seu currículo. Sua pontuação ATS.');
  });

  it('should navigate to analyzer on CTA click', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const ctaButton = compiled.querySelector('button') as HTMLButtonElement;
    expect(ctaButton).toBeTruthy();
    ctaButton.click();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/analyzer']);
  });

  it('should display mock score card with score 78', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const elements = Array.from(compiled.querySelectorAll('*'));
    const scoreElement = elements.find(el => el.textContent?.trim() === '78');
    expect(scoreElement).toBeTruthy();
  });

  it('should not contain any button inside header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('header');
    expect(header).toBeTruthy();
    const buttonInHeader = header?.querySelector('button');
    expect(buttonInHeader).toBeFalsy();
  });

  it('should render 3 feature cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const featureCards = compiled.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(3);
  });
});
