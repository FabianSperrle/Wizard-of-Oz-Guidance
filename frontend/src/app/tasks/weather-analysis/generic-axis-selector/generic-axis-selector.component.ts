import { Component, Directive, EventEmitter, Input, Output } from '@angular/core';
import { MeasurementColorDimension } from '../weather-analysis.component';
import { Event, GuidanceInteractionEvent, TrackingEvent } from '../../../services/provenance.service';
import { UserRole } from '../../../services/study/user-role.service';
import { MatDialogRef } from '@angular/material/dialog';
import { TrackableVisualizationComponent } from '../../../visualizations/trackable-visualization.component';
import {
  AxisSelectorChangeDialogComponent,
  AxisSelectorChangeDialogData
} from '../axis-selector/axis-selector-change-dialog/axis-selector-change-dialog.component';
import { DimpVisSuggestion } from '../../../visualizations/suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';

@Directive()
export abstract class GenericAxisSelectorComponent<T> extends TrackableVisualizationComponent<T> {

  @Input() dimensions: T[];
  @Input() label: string;
  @Input() value: T;
  @Output() valueChange = new EventEmitter<T>();
  @Input() public isOverlay = false;

  valueBeforePreview: T;

  public userRole: UserRole;
  latestUserEventsForSynchro = new Map<string, TrackingEvent<T>>();
  public suggestions: DimpVisSuggestion<T>[] = [];

  getComponent(): string {
    return 'axis-selector';
  }

  getName(): string {
    return this.label;
  }

  protected saveUserEventForSynchro(event: TrackingEvent<T>): void {
    this.latestUserEventsForSynchro.set('axis select', event);
  }

  processEvent(message: TrackingEvent<T>, isSynchroUpdate = false): void {
    if (message.event === 'axis select') {
      this.saveUserEventForSynchro(message);
    } else {
      return;
    }

    if (this.userRole === 'wizard' && !isSynchroUpdate) {
      return;
    }

    console.log(this.getComponent(), message.component, this.getName(), message.name);
    if (!(message.component === this.getComponent() && message.name === this.getName())) {
      return;
    }


    switch (message.event) {
      case 'axis select':
        this.switchAxis(message.value);
        break;
    }
  }

  guidancePreviewEnd(suggestion: DimpVisSuggestion<T>): void {
    this.value = this.valueBeforePreview;
    this.valueChange.next(this.valueBeforePreview);
  }

  guidancePreviewStart(suggestion: DimpVisSuggestion<T>): void {
    this.valueBeforePreview = this.value;
    this.value = suggestion.event.value;
    this.valueChange.next(suggestion.event.value);
  }

  synchronize(): void {
    this.latestUserEventsForSynchro.forEach((value, key) => {
      this.processEvent(value, true);
    });
  }

  private switchAxis(value: T, external = false): void {
    this.value = value;
    this.valueChange.next(value);
  }

  selectAxis(newValue: T): void {
    if (this.userRole === 'user') {
      this.value = newValue;
      this.valueChange.next(newValue);
      const selectEvent = new TrackingEvent(this.getComponent(), this.getName(), 'axis select', newValue);
      this.provenanceService.log(selectEvent, this.userRole);
    } else if (this.userRole === 'wizard') {
      const dialogRef: MatDialogRef<AxisSelectorChangeDialogComponent, AxisSelectorChangeDialogData> = this.dialog.open(AxisSelectorChangeDialogComponent, {
        hasBackdrop: true,
        disableClose: false,
        width: '350px',
        data: {action: undefined, event: null}
      });

      dialogRef.afterClosed().subscribe(result => {
        const changeEvent = new TrackingEvent(this.getComponent(), this.getName(), 'axis select', newValue);
        switch (result?.action) {
          // @ts-ignore: no-switch-case-fall-through
          case 'suggest change':
            const sugg = new DimpVisSuggestion('Change Dimension', this.getSuggestionDescription(newValue), changeEvent);
            const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
            this.provenanceService.log(guidanceEvent, this.userRole);
            this.suggestions.push(sugg);
          // no break because suggestions should also brush
          // @ts-ignore: no-switch-case-fall-through
          case 'change':
            this.provenanceService.log(changeEvent, this.userRole);
            this.value = newValue;
            this.valueChange.next(newValue);
            break;
        }
      });
    }
  }

  getSuggestionDescription(value: T): string {
    return `New ${this.getName()}: ${value}`;
  }

  handleNewSuggestion(event: Event): void {
    switch (event) {
      case 'axis select':
        this.suggestCurrentAxis();
    }
  }

  private suggestCurrentAxis(): void {
    const changeEvent = new TrackingEvent(this.getComponent(), this.getName(), 'axis select', this.value);
    const sugg = new DimpVisSuggestion('Change Dimension', this.getSuggestionDescription(this.value), changeEvent);
    const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
    this.provenanceService.log(guidanceEvent, this.userRole);
  }


  resetToDefault() {
    // nothing to reset
  }
}
