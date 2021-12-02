import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudyConditionService {

  private _condition: StudyCondition;
  public studyCondition = new Subject<StudyCondition>();

  constructor() { }

  get condition(): StudyCondition {
    return this._condition;
  }

  set condition(value: StudyCondition) {
    this._condition = value;
    this.studyCondition.next(this._condition)
  }
}

export type StudyCondition = 'blue' | 'purple' | 'orange' | 'yellow' | 'training' | 'training2';
