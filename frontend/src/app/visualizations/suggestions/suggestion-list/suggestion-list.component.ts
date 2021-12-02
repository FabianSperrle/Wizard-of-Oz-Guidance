import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DimpVisSuggestion, InteractionTypes } from '../dimpvis-suggestion-card/dimpvis-suggestion-card.component';
import { UserRole } from '../../../services/study/user-role.service';
import { Event } from '../../../services/provenance.service';

@Component({
  selector: 'gs-suggestion-list',
  templateUrl: './suggestion-list.component.html',
  styleUrls: ['./suggestion-list.component.scss']
})
export class SuggestionListComponent<T> {

  @Input() suggestions: DimpVisSuggestion<T>[]
  @Input() hideTitle: boolean = false;
  @Input() userRole: UserRole;
  @Input() horizontal: boolean = false;
  @Input() newSuggestionActions: NewSuggestionActionPair[];
  @Output() newSuggestion = new EventEmitter<Event>();

  @Output() actions = new EventEmitter<SuggestionInteractionPair<T>>();

  constructor() { }
}


export interface SuggestionInteractionPair<T> {
  suggestion: DimpVisSuggestion<T>;
  action: InteractionTypes;
}

export interface NewSuggestionActionPair {
  action: Event;
  title: string;
}
