import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <span class="brand"><mat-icon>receipt_long</mat-icon> Korp NF</span>
      <div class="nav-links">
        <a mat-button routerLink="/produtos" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:false}"><mat-icon>inventory_2</mat-icon> Produtos</a>
        <a mat-button routerLink="/notas-fiscais" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:false}"><mat-icon>description</mat-icon> Notas Fiscais</a>
      </div>
    </mat-toolbar>
    <main class="content"><router-outlet /></main>
  `,
  styles: [`
    .navbar { gap: 16px; }
    .brand  { display: flex; align-items: center; gap: 8px; font-size: 1.2rem; font-weight: 600; margin-right: auto; }
    .nav-links { display: flex; gap: 8px; }
    .nav-links a { display: flex; align-items: center; gap: 6px; }
    .active-link { background: rgba(255,255,255,0.15); border-radius: 4px; }
    .content { padding: 24px; max-width: 1200px; margin: 0 auto; }
  `]
})
export class AppComponent {}
