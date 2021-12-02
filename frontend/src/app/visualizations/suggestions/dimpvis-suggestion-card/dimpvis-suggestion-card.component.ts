import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SuggestionLinkServiceService } from 'src/app/services/suggestion-link-service.service';
import { GuidanceDegree, TrackingEvent } from '../../../services/provenance.service';
import { UserRole } from '../../../services/study/user-role.service';

@Component({
  selector: 'gs-dimpvis-suggestion-card',
  templateUrl: './dimpvis-suggestion-card.component.html',
  styleUrls: ['./dimpvis-suggestion-card.component.scss']
})
export class DimpvisSuggestionCardComponent implements OnInit {

  constructor(public suggestionLinkingService: SuggestionLinkServiceService) { }

  @Input() suggestion: DimpVisSuggestion<any>;
  @Input() role: UserRole;
  @Input() isDialog: boolean;
  @Output() feedback = new EventEmitter<InteractionTypes>();

  ngOnInit(): void {
    console.log(this.suggestion);
  }

  showLinkButton(suggestion: DimpVisSuggestion<any>): boolean {
    if (this.suggestionLinkingService.getAllSuggestions().length > 1) {
      return suggestion.linkedSuggestions?.length === 0
    }
    return false;
  }

}

export class DimpVisSuggestion<T> {
  title: string;
  description: string;
  event: TrackingEvent<T>;
  id: number;
  degree: GuidanceDegree = 'directing';
  linkedSuggestions: number[] = [];
  preview: boolean = false;

  constructor(title: string, description: string, event: TrackingEvent<T>, degree: GuidanceDegree = 'directing') {
    this.title = title;
    this.description = description;
    this.event = event;
    this.id = event.time;
    this.degree = degree;
  }
}

export type InteractionTypes = 'make' | 'accept' | 'reject' | 'preview start' | 'preview end' | 'retract' | 'link';
