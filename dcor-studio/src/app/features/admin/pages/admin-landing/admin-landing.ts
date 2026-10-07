import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-landing.html',
  styleUrls: ['./admin-landing.css']
})
export class AdminLandingComponent {
  
}
