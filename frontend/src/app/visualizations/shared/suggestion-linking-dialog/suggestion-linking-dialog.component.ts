import { Component, Inject, OnInit } from '@angular/core';
import { SuggestionLinkServiceService } from '../../../services/suggestion-link-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DimpVisSuggestion } from '../../suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';

@Component({
  selector: 'gs-suggestion-linking-dialog',
  templateUrl: './suggestion-linking-dialog.component.html',
  styleUrls: ['./suggestion-linking-dialog.component.scss']
})
export class SuggestionLinkingDialogComponent implements OnInit {
  suggestions: SuggestionLinkingDialogComponentData[];

  constructor(private suggestionLinkingService: SuggestionLinkServiceService,
              private dialogRef: MatDialogRef<SuggestionLinkingDialogComponent>,
              @Inject(MAT_DIALOG_DATA) private triggerSugg: DimpVisSuggestion<any>) { }

  ngOnInit(): void {
    this.suggestions = this.suggestionLinkingService.getAllSuggestions()
      .filter(s => s.id !== this.triggerSugg.id)
      .filter(s => s.linkedSuggestions === undefined || s.linkedSuggestions?.length === 0)
      .filter(s => s.event.component === this.triggerSugg.event.component ? s.event.name !== this.triggerSugg.event.name : true)
      .map(s => {
        return {
          ...s,
          selected: false
      }
    })
  }

  getReadableName(suggestion: SuggestionLinkingDialogComponentData): string {
    switch (suggestion.event.component) {
      case 'axis-selector':
        return 'Axis Selection';
      case 'dimpvis':
        return 'Scatter Plot';
      case 'linechart':
        return 'Line Chart';
      case 'world-map':
        return 'World Map';
      case 'timeslider':
        return 'Time Slider';
      default:
        return 'Unknown Component';
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  link(): void {
    const components = this.suggestions.filter(s => s.selected === true).map(s => s.event.component+s.event.name);
    const count = names =>
      names.reduce((a, b) => ({ ...a,
        [b]: (a[b] || 0) + 1
      }), {})
    const duplicates = dict => Object.keys(dict).filter((a) => dict[a] > 1)

    const errors = duplicates(count(components));

    if (errors.length === 0) {
      this.dialogRef.close(this.suggestions);
    } else {
      alert('You must not link suggestions from the same component!');
    }
  }
}

export interface SuggestionLinkingDialogComponentData extends DimpVisSuggestion<any> {
  selected?: boolean;
}
