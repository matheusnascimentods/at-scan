import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './index.component.html',
  styleUrls: []
})
export class LandingComponent {
  constructor(private router: Router) {}

  navigateToAnalyzer(): void {
    this.router.navigate(['/analyzer']);
  }
}
