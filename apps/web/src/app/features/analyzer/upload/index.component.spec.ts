import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadComponent } from './index.component';
import { By } from '@angular/platform-browser';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have Next button disabled initially', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.disabled).toBeTrue();
  });

  it('should enable Next button and show filename when a valid PDF file is selected', (done) => {
    const file = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
    
    const event = { target: { files: [file] } } as unknown as Event;
    component.onFileSelected(event);

    setTimeout(() => {
      fixture.detectChanges();
      const button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.disabled).toBeFalse();

      const fileNameText = fixture.debugElement.query(By.css('#fileNameText'));
      expect(fileNameText.nativeElement.textContent).toContain('resume.pdf');
      done();
    }, 100);
  });

  it('should reject non-PDF file and show error message', () => {
    const file = new File(['docx content'], 'resume.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const event = { target: { files: [file] } } as unknown as Event;
    component.onFileSelected(event);

    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.disabled).toBeTrue();
    expect(component.errorMessage).toBe('Apenas arquivos PDF são permitidos.');
  });

  it('should emit fileSelected when clicking Next', (done) => {
    component.fileName = 'resume.pdf';
    component.fileBase64 = 'base64Content';
    fixture.detectChanges();

    component.fileSelected.subscribe(event => {
      expect(event.fileBase64).toBe('base64Content');
      expect(event.fileName).toBe('resume.pdf');
      done();
    });

    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();
  });

  it('should update border class on dragover/dragleave', () => {
    const dropzone = fixture.debugElement.query(By.css('div.cursor-pointer'));
    
    const dragOverEvent = new DragEvent('dragover');
    dropzone.nativeElement.dispatchEvent(dragOverEvent);
    fixture.detectChanges();
    expect(component.isDragOver).toBeTrue();

    const dragLeaveEvent = new DragEvent('dragleave');
    dropzone.nativeElement.dispatchEvent(dragLeaveEvent);
    fixture.detectChanges();
    expect(component.isDragOver).toBeFalse();
  });
});
