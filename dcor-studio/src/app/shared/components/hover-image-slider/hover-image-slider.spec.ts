import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoverImageSlider } from './hover-image-slider';

describe('HoverImageSlider', () => {
  let component: HoverImageSlider;
  let fixture: ComponentFixture<HoverImageSlider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoverImageSlider],
    }).compileComponents();

    fixture = TestBed.createComponent(HoverImageSlider);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
