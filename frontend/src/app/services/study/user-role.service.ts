import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {

  role: BehaviorSubject<UserRole> = new BehaviorSubject<UserRole>(undefined);
  isOverlay = false;

  constructor() { }

  public isUser(): boolean {
    return this.role.value === 'user';
  }

  public isWizard(): boolean {
    return this.role.value === 'wizard';
  }
}

export type UserRole = 'user' | 'wizard' | 'overlay' | undefined;
