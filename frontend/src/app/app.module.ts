import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DimpvisComponent } from './visualizations/dimpvis/dimpvis.component';
import { HttpClientModule } from '@angular/common/http';
import { MatSliderModule } from '@angular/material/slider';
import { TimesliderComponent } from './visualizations/timeslider/timeslider.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChannelManagerComponent } from './sockets/channel-manager/channel-manager.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrushDialogComponent } from './visualizations/dimpvis/brush-dialog/brush-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { OverlayComponent } from './utils/overlay/overlay.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TimeSliderBrushDialogComponent } from './visualizations/timeslider/brush-dialog/time-slider-brush-dialog/time-slider-brush-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { WeatherAnalysisComponent } from './tasks/weather-analysis/weather-analysis.component';
import { AxisSelectorComponent } from './tasks/weather-analysis/axis-selector/axis-selector.component';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { LineChartComponent } from './visualizations/line-chart/line-chart.component';
import { LineChartBrushDialogComponent } from './visualizations/line-chart/line-chart-brush-dialog/line-chart-brush-dialog.component';
import { AxisSelectorChangeDialogComponent } from './tasks/weather-analysis/axis-selector/axis-selector-change-dialog/axis-selector-change-dialog.component';
import { TaskListComponent } from './tasks/weather-analysis/task-list/task-list.component';
import { MatStepperModule } from '@angular/material/stepper';
import { WorldMapComponent } from './visualizations/world-map/world-map.component';
import { ContinentSelectionDialogComponent } from './visualizations/world-map/continent-selection-dialog/continent-selection-dialog.component';
import { UserDimpvisBrushDialogComponent } from './visualizations/dimpvis/user-dimpvis-brush-dialog/user-dimpvis-brush-dialog.component';
import { StationTooltipComponent } from './visualizations/dimpvis/station-tooltip/station-tooltip.component';
import { DecimalPipe } from '@angular/common';
import {
  NameFilterPipe,
  StationFilterPipe,
  StationListComponent
} from './visualizations/station-list/station-list.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ColorSelectorComponent } from './tasks/weather-analysis/color-selector/color-selector.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { SuggestionLinkingDialogComponent } from './visualizations/shared/suggestion-linking-dialog/suggestion-linking-dialog.component';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SuggestionListComponent } from './visualizations/suggestions/suggestion-list/suggestion-list.component';
import { DimpvisSuggestionCardComponent } from './visualizations/suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';
import { GenericAxisSelectorComponent } from './tasks/weather-analysis/generic-axis-selector/generic-axis-selector.component';
import { GenericVisualizationButtonsComponent } from './tasks/weather-analysis/generic-visualization-buttons/generic-visualization-buttons.component';
import { VisualizationInfoTooltipComponent } from './tasks/weather-analysis/visualization-info-tooltip/visualization-info-tooltip.component';
import { TLXComponent } from './tasks/statistics/tlx/tlx.component';

@NgModule({
  declarations: [
    AppComponent,
    DimpvisComponent,
    TimesliderComponent,
    ChannelManagerComponent,
    BrushDialogComponent,
    DimpvisSuggestionCardComponent,
    OverlayComponent,
    TimeSliderBrushDialogComponent,
    WeatherAnalysisComponent,
    AxisSelectorComponent,
    LineChartComponent,
    LineChartBrushDialogComponent,
    AxisSelectorChangeDialogComponent,
    TaskListComponent,
    WorldMapComponent,
    ContinentSelectionDialogComponent,
    UserDimpvisBrushDialogComponent,
    StationTooltipComponent,
    StationListComponent,
    StationFilterPipe,
    NameFilterPipe,
    ColorSelectorComponent,
    SuggestionLinkingDialogComponent,
    SuggestionListComponent,
    GenericVisualizationButtonsComponent,
    VisualizationInfoTooltipComponent,
    TLXComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    HttpClientModule,
    MatSliderModule,
    FormsModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    FlexLayoutModule,
    MatCardModule,
    DragDropModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatSelectModule,
    MatOptionModule,
    MatStepperModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDividerModule,
    MatListModule,
    MatTooltipModule,
    MatRippleModule
  ],
  providers: [DecimalPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
