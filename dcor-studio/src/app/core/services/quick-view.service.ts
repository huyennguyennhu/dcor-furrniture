import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CatalogProduct } from '../../shared/models/catalog.model';

@Injectable({
  providedIn: 'root'
})
export class QuickViewService {
  private productSubject = new BehaviorSubject<CatalogProduct | null>(null);
  private isOpenSubject = new BehaviorSubject<boolean>(false);

  product$: Observable<CatalogProduct | null> = this.productSubject.asObservable();
  isOpen$: Observable<boolean> = this.isOpenSubject.asObservable();

  get currentProduct(): CatalogProduct | null {
    return this.productSubject.value;
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  open(product: any): void {
    if (!product) return;
    this.productSubject.next(product);
    this.isOpenSubject.next(true);
  }

  close(): void {
    this.isOpenSubject.next(false);
  }
}

