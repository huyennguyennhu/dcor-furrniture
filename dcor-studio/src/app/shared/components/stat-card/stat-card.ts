import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.html',
  styleUrls: ['./stat-card.css']
})
export class StatCard {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() trend?: { value: number; isPositive: boolean };
  @Input() description?: string;
  
  // To allow passing an icon, we will use <ng-content select="[icon]"></ng-content> in the template.
}
