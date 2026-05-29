import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewButtonComponent } from './review-button.component';

describe('ReviewButtonComponent', () => {
  let component: ReviewButtonComponent;
  let fixture: ComponentFixture<ReviewButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReviewButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
