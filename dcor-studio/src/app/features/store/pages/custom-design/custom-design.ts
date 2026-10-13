import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-design',
  standalone: true,
  imports: [IconComponent, CommonModule],
  templateUrl: './custom-design.html',
  styleUrls: ['./custom-design.css']
})
export class CustomDesignComponent {
  
}

