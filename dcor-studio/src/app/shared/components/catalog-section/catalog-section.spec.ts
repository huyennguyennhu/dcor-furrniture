import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogSection } from './catalog-section';

describe('CatalogSection', () => {
  let component: CatalogSection;
  let fixture: ComponentFixture<CatalogSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogSection],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
