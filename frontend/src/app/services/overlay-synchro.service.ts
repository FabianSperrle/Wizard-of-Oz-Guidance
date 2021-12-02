import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OverlaySynchroService {

  sync$ = new Subject<number>();

  constructor() { }

  public syncNow(): void {
    this.sync$.next(+new Date());
  }
}
