import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/index.component';
import { AnalyzerComponent } from './features/analyzer/index.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'analyzer',
    component: AnalyzerComponent
  }
];

