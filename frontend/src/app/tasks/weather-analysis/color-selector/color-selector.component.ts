import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { GenericAxisSelectorComponent } from '../generic-axis-selector/generic-axis-selector.component';

@Component({
  selector: 'gs-color-selector',
  templateUrl: './color-selector.component.html',
  styleUrls: ['./color-selector.component.scss']
})
export class ColorSelectorComponent extends GenericAxisSelectorComponent<MeasurementColorDimension> {

}
