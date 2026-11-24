import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomDesignComponent } from './custom-design';

describe('CustomDesignComponent', () => {
  let component: CustomDesignComponent;
  let fixture: ComponentFixture<CustomDesignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomDesignComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomDesignComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
