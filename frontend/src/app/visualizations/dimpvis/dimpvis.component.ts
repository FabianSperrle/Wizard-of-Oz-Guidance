import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { GenericScatterData } from '../../services/data/gapminder.service';
import {
  axisBottom,
  axisLeft,
  brush,
  BrushBehavior,
  D3BrushEvent,
  extent,
  interpolateRdBu,
  line,
  rollup,
  scaleLinear,
  ScaleLinear,
  scaleOrdinal,
  scaleSequential,
  schemeCategory10,
  select,
  Selection
} from 'd3';
import { safeExtent } from '../../utils/utils';
import { environment } from '../../../environments/environment';
import { Event, GuidanceInteractionEvent, ProvenanceService, TrackingEvent } from '../../services/provenance.service';
import { TrackableVisualizationComponent } from '../trackable-visualization.component';
import { ChannelService } from '../../services/channel/channel.service';
import { UserRoleService } from '../../services/study/user-role.service';
import { TooltipService } from '../../services/tooltip.service';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { BrushDialogComponent, BrushDialogData } from './brush-dialog/brush-dialog.component';
import { OverlaySynchroService } from '../../services/overlay-synchro.service';
import { Measurement, MeasurementDimensionUnitMap } from '../../services/data/weatherdata.service';
import { UserDimpvisBrushDialogComponent } from './user-dimpvis-brush-dialog/user-dimpvis-brush-dialog.component';
import { StationTooltipComponent } from './station-tooltip/station-tooltip.component';
import {
  MeasurementColorDimension,
  MeasurementDimension
} from '../../tasks/weather-analysis/weather-analysis.component';
import { defaultContinents } from '../world-map/world-map.component';
import { SuggestionLinkServiceService } from '../../services/suggestion-link-service.service';
import { DimpVisSuggestion } from '../suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';
import { NewSuggestionActionPair } from '../suggestions/suggestion-list/suggestion-list.component';
import { SynchroFixerService } from '../../services/synchro-fixer.service';

export type ByYearMap = Map<Date, Measurement>;
export interface ScatterData {
  byYearMap: ByYearMap;
  station: string;
  continent: string;
}

@Component({
  selector: 'gs-dimpvis',
  templateUrl: './dimpvis.component.html',
  styleUrls: ['./dimpvis.component.scss']
})
export class DimpvisComponent extends TrackableVisualizationComponent<DVT> implements AfterViewInit {

  width = 400;
  height = 300;
  @Input() data: Measurement[];
  @Output() highlightedIDsChange = new EventEmitter<Set<string>>();
  @ViewChild('svgContainer', {static: true}) svgContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('dimpvis', {static: true}) svgRef!: ElementRef<SVGSVGElement>;
  public suggestions: DimpVisSuggestion<TwoDSelection>[] = [];
  latestUserEventsForSynchro = new Map<string, TrackingEvent<DVT>>();
  private svg!: Selection<SVGSVGElement, any, any, any>;
  private circles!: Selection<SVGCircleElement, ScatterData, any, any>;
  private brushGroup!: Selection<SVGGElement, any, any, any>;
  private brush!: BrushBehavior<unknown>;
  private brushDoubleClickTimeout!: number | null;
  private xRange: ScaleLinear<number, number> = scaleLinear();
  xDomain = this.xRange.domain();
  yDomain = this.xRange.domain();
  private yRange: ScaleLinear<number, number> = scaleLinear();
  private colorScale: any = scaleSequential(interpolateRdBu);
  private yAxisExtent: [number, number] = [0, 0];
  private xAxisExtent: [number, number] = [0, 0];
  private xAxis = axisBottom(this.xRange).ticks(12);
  private yAxis = axisLeft(this.yRange).ticks(12);
  private padding = {left: 50, right: 30, top: 30, bottom: 0};
  private flashlightGroup: Selection<SVGGElement, any, any, any>;

  constructor(private elem: ElementRef,
              private toolTipService: TooltipService,
              provenanceService: ProvenanceService<DVT>,
              channelService: ChannelService,
              userRoleService: UserRoleService,
              dialog: MatDialog,
              overlaySynchro: OverlaySynchroService,
              private synchroFixer: SynchroFixerService,
              suggestionLinkingService: SuggestionLinkServiceService) {
    super(channelService, overlaySynchro, provenanceService, userRoleService, suggestionLinkingService, dialog);
    this.synchroFixer.dimpvisRemoveHighlight.subscribe(_ => {
      this.latestUserEventsForSynchro.delete('highlight');
    })
  }

  private _xAxisDimension: MeasurementDimension;
  get xAxisDimension(): MeasurementDimension {
    return this._xAxisDimension;
  }
  @Input()
  set xAxisDimension(value: MeasurementDimension) {
    this._xAxisDimension = value;
    this.xAccessor = (d: Measurement) => d?.[this._xAxisDimension];
    this.xAxisExtent = safeExtent(extent(this.data, this.xAccessor));
    this.xRange.domain(this.xAxisExtent);
    this.zoom();
  }
  @Output() xAxisDimensionChange = new EventEmitter<MeasurementDimension>();

  private _yAxisDimension: MeasurementDimension;
  get yAxisDimension(): MeasurementDimension {
    return this._yAxisDimension;
  }
  @Input()
  set yAxisDimension(value: MeasurementDimension) {
    this._yAxisDimension = value;
    this.yAccessor = (d: Measurement) => d?.[this._yAxisDimension];
    this.yAxisExtent = safeExtent(extent(this.data, this.yAccessor));
    this.yRange.domain(this.yAxisExtent);
    this.zoom();
  }
  @Output() yAxisDimensionChange = new EventEmitter<MeasurementDimension>();

  private _colorDimension: MeasurementColorDimension;
  get colorDimension(): MeasurementColorDimension {
    return this._colorDimension;
  }
  @Input()
  set colorDimension(value: MeasurementColorDimension) {
    this._colorDimension = value;
    this.colorAccessor = (d: Measurement) => d?.[this._colorDimension];
    if (this.colorDimension !== 'continent') {
      const colorExtent = safeExtent(extent(this.data, this.colorAccessor as (d: Measurement) => number));
      this.colorScale = scaleSequential(interpolateRdBu).domain(colorExtent);
    } else {
      this.colorScale = scaleOrdinal(schemeCategory10).domain(defaultContinents);
    }
    this.zoom();
  }
  @Output() colorDimensionChange = new EventEmitter<MeasurementColorDimension>();

  private _currYear: Date;
  get currYear(): Date {
    return this._currYear;
  }
  @Input()
  set currYear(value: Date) {
    this._currYear = value;
    if (this.data && this.svg) {
      this.updatePlot();
    }
  }

  private _highlightedIDs: Set<string> = new Set();
  get highlightedIDs(): Set<string> {
    return this._highlightedIDs;
  }
  @Input() set highlightedIDs(value: Set<string>) {
    this._highlightedIDs = value;
    this.highlightIDs(this.highlightedIDs);
  }

  private _selectedStations: Set<string> = new Set();
  get selectedStations(): Set<string> {
    return this._selectedStations;
  }
  @Input() set selectedStations(value: Set<string>) {
    this._selectedStations = value;
    this.updatePlot();
  }

  getComponent(): string {
    return 'dimpvis';
  }

  getName(): string {
    return 'd1';
  }

  ngAfterViewInit(): void {
    const boundingClientRect: DOMRect = this.svgContainer.nativeElement.getBoundingClientRect();
    const boundingWidth = boundingClientRect.width;
    const padding = this.padding.left + this.padding.right;
    this.width = this.isOverlay ? (boundingWidth - .2 * padding) * 5 : boundingWidth - padding;

    this.svg = select(this.svgRef.nativeElement)
      .attr('width', this.width + this.padding.left + this.padding.right)
      .attr('height', this.height + this.padding.top + this.padding.bottom);

    this.flashlightGroup = this.svg.append('g')
      .style('pointer-events', 'none')
      .attr('id', 'flashlight');

    if (!this.isOverlay) {
      this.brush = brush()
        .on('end', this.brushed.bind(this));

      this.brushGroup = this.svg.select<SVGGElement>('#brush')
        // .attr('transform', `translate(${this.padding.top}, ${this.padding.left})`)
        .attr('class', 'brush')
        .call(this.brush);
    }

    this.yAxisExtent = safeExtent(extent(this.data, this.yAccessor));
    this.xAxisExtent = safeExtent(extent(this.data, this.xAccessor));

    this.xRange.domain(this.xAxisExtent).range([this.padding.left, this.width]);
    this.yRange.domain(this.yAxisExtent).range([this.height, this.padding.top]);

    this.initializePlot(this.data);
    this.updatePlot();
  }

  private setInitialZoomBounds() {

  }

  private defaultXDim: MeasurementDimension;
  private defaultYDim: MeasurementDimension;
  private defaultColorDim: MeasurementColorDimension;
  storeDefaultSettings(): void {
    this.defaultXDim = this.xAxisDimension;
    this.defaultYDim = this.yAxisDimension;
    this.defaultColorDim = this.colorDimension;
  }

  resetToDefault() {
    this.resetToDefaultSettings();
    this.syncResetToDefault();
  }

  resetToDefaultSettings(): void {
    this.xAxisDimension = this.defaultXDim;
    this.xAxisDimensionChange.emit(this.xAxisDimension);

    this.yAxisDimension = this.defaultYDim;
    this.yAxisDimensionChange.emit(this.yAxisDimension);

    this.colorDimension = this.defaultColorDim;
    this.colorDimensionChange.emit(this.colorDimension);

    this.highlightedIDs = new Set();
    this.highlightedIDsChange.emit(this.highlightedIDs);
    this.synchroFixer.lineChartRemoveHighlight.next(true);

    this.zoomOut();
  }

  guidanceMake(suggestion: DimpVisSuggestion<DVT>): void {
    switch (suggestion.event.event) {
      case 'highlight':
        const ids = new Set(suggestion.event.value as string[]);
        this.highlightedIDs = ids;
        this.highlightedIDsChange.emit(this.highlightedIDs);
        this.synchroFixer.lineChartRemoveHighlight.next(true);
        break;
      case 'suggest zoom':
        break;
    }
  }

  protected guidanceReject(suggestion: DimpVisSuggestion<DVT>) {
    if (suggestion.event.event === 'highlight') {
      this.highlightedBeforePreview = new Set();
    }
    super.guidanceReject(suggestion);
  }

  protected guidanceRetract(suggestion: DimpVisSuggestion<DVT>) {
    if (suggestion.event.event === 'highlight') {
      this.highlightedBeforePreview = new Set();
    }
    super.guidanceRetract(suggestion);
  }

  guidancePreviewEnd(suggestion): void {
    switch (suggestion.event.event) {
      case 'suggest zoom':
        this.xRange.domain(this.xDomain);
        this.yRange.domain(this.yDomain);
        this.zoom();

        this.svg.select('#zoomPreviewRect')
          .remove();
        break;
      case 'highlight':
        this.highlightedIDs = this.highlightedBeforePreview;
        // this.highlightIDs(this.highlightedIDs);
        this.highlightedIDsChange.next(this.highlightedIDs);
        this.synchroFixer.lineChartRemoveHighlight.next(true);
        break;
    }
  }

  private highlightedBeforePreview = new Set<string>();
  guidancePreviewStart(suggestion: DimpVisSuggestion<DVT>): void {
    switch (suggestion.event.event) {
      case 'suggest zoom':
        let [[x0, x1], [y0, y1]] = suggestion.event.value as TwoDSelection;
        [x0, x1] = [x0, x1].map(this.xRange);
        [y1, y0] = [y0, y1].map(this.yRange);

        this.xDomain = [...this.xRange.domain()];
        this.yDomain = [...this.yRange.domain()];

        const zoomPreviewRect = this.svg.append('rect')
          .attr('id', 'zoomPreviewRect')
          .attr('x', x0)
          .attr('y', y0)
          .attr('width', x1 - x0)
          .attr('height', y1 - y0)
          .attr('fill', 'none')
          .attr('stroke', 'red');

        this.zoomIn(suggestion.event.value as TwoDSelection);

        [x0, x1] = [x0, x1].map(this.xRange);
        [y1, y0] = [y0, y1].map(this.yRange);

        zoomPreviewRect
          .transition().duration(environment.animationDuration)
          .attr('x', x0)
          .attr('y', y0)
          .attr('width', x1 - x0)
          .attr('height', y1 - y0);
        break;
      case 'highlight':
        this.highlightedBeforePreview = this.highlightedIDs;
        this.highlightIDs(new Set(suggestion.event.value as string[]));
        // this.highlight(suggestion.event.value as TwoDSelection);
        this.highlightedIDsChange.next(this.highlightedIDs);
    }
  }

  suggestCurrentZoomLevel(): void {
    const [minX, maxX] = this.xRange.domain();
    const [minY, maxY] = this.yRange.domain();
    const bounds: TwoDSelection = [[minX, maxX], [minY, maxY]];
    const trackingEvent = new TrackingEvent(this.getComponent(), this.getName(), 'suggest zoom', bounds);
    const sugg = new DimpVisSuggestion('Zoom', this.getSuggestionDescription(trackingEvent.event, trackingEvent.value), trackingEvent);
    const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
    this.provenanceService.log(guidanceEvent, this.userRole);
    // this.suggestions.push(sugg);
    // this.suggestionLinkingService.addSuggestion(sugg);
  }

  processEvent(message: TrackingEvent<DVT>, isSynchroUpdate = false): void {
    // before potentially exiting, save last user event for later synchro
    this.saveUserEventForSynchro(message);

    if (this.userRole === 'wizard' && !isSynchroUpdate) {
      if (message.event === 'highlight') {
        this.synchroFixer.lineChartRemoveHighlight.next(true);
      }
      return;
    }

    switch (message.event) {
      case 'flashlight on':
        // const m = Object.entries(message.value).map(([k, v]) => [Date.now(), v]);
        const m = new Map(Object.entries(message.value as FlashlightData).map(([k, v]) => [new Date(Date.parse(k)), v]));
        this.addFlashlightTrail(m, true);
        break;
      case 'flashlight off':
        this.removeFlashlightTrail(true);
        break;
      case 'zoom out':
        this.zoomOut();
        break;
      // suggest zoom events are wrapped in GuidanceEvents and will only be processed here once they were accepted
      case 'suggest zoom':
      case 'zoom in':
        this.zoomIn(message.value as TwoDSelection);
        break;
      case 'highlight':
        const ids = new Set(message.value as string[]);
        this.highlightIDs(ids);
        this.highlightedIDsChange.emit(ids);
        // console.log(this.userRole, this.isOverlay, this.getComponent(), 'processed highlight');
        // this.synchroFixer.lineChartRemoveHighlight.next(true);
        break;
      case 'reset':
        this.resetToDefaultSettings();
        break;
    }

  }

  synchronize(): void {
    if (this.latestUserEventsForSynchro.has('reset')) {
      this.resetToDefaultSettings();
      this.latestUserEventsForSynchro.delete('reset');
    }
    if (!this.latestUserEventsForSynchro.has('zoom')) {
      this.zoomOut();
    }
    this.latestUserEventsForSynchro.forEach((value, key) => {
      this.processEvent(value, true);
    });
  }

  getSuggestionDescription(event: Event, [[minX, maxX], [minY, maxY]]: TwoDSelection): string {
    return `${event === 'suggest zoom' ? 'Zoom to' : 'Highlight'} ${minY.toFixed(2)} <= y <= ${maxY.toFixed(2)} & ${minX.toFixed(2)} <= x <= ${maxX.toFixed(2)}`;
  }

  handleNewSuggestion(event: Event): void {
    switch (event) {
      case 'suggest zoom':
        this.suggestCurrentZoomLevel();
        break;
    }
  }

  protected saveUserEventForSynchro(message: TrackingEvent<DVT>): void {
    if (message.event === 'reset') {
      this.latestUserEventsForSynchro.clear();
    }
    const syncedEvents: Event[] = ['zoom in', 'zoom out', 'highlight', 'reset', 'suggest zoom'];
    if (syncedEvents.includes(message.event)) {
      if (message.event === 'zoom in' || message.event === 'zoom out' || message.event === 'suggest zoom') {
        this.latestUserEventsForSynchro.set('zoom', message);
      } else {
        this.latestUserEventsForSynchro.set(message.event, message);
      }
    }
  }

  private xAccessor: (d?: Measurement) => number = () => 0;

  private yAccessor: (d?: Measurement) => number = () => 0;

  private colorAccessor: (d?: Measurement) => number | string = () => 0;

  private initializePlot(data: Measurement[]): void {
    this.currYear ??= data?.[0]?.date;
    if (this.currYear === undefined) {
      throw new Error('Invalid data or startYear!');
    }

    this.svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0, ${this.height})`);
    this.svg.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', `translate(${this.padding.left}, 0)`);
  }

  private updatePlot(): void {
    if (!this.svg) { return; }

    const byYear: Map<string, ByYearMap> = rollup(this.data, d => d[0], d => d.station, d => d.date);
    const scatterData = Array.from(byYear.entries()).map(([station, values]) => {
      return {
        station,
        byYearMap: values,
        continent: values.values().next().value.continent
      } as ScatterData;
    });

    this.circles = this.svg.select('#circles').selectAll<SVGCircleElement, ScatterData>('circle')
      .data(scatterData.filter(d => this._selectedStations.has(d.station)), d => d.station)
      .join(enter => enter.append('circle')
        .attr('r', 5)
        .attr('stroke-width', '2px')
        .attr('stroke', null)
        .on('mouseenter', (e: any, d) => {
          this.addFlashlightTrail(d.byYearMap);
          // select(e.currentTarget).raise();
          const tooltip = this.toolTipService.openTooltip(StationTooltipComponent, {x: e.x + 20, y: e.y + 20});
          tooltip.data = {
            station: {
              name: d.station,
              continent: d.continent
            },
            xDim: this._xAxisDimension,
            xVal: this.xAccessor(d.byYearMap.get(this.currYear)),
            yDim: this._yAxisDimension,
            yVal: this.yAccessor(d.byYearMap.get(this.currYear)),
          };

        })
        .on('mouseleave', () => {
          this.removeFlashlightTrail();
          this.toolTipService.close();
        }), update => update
          .attr('fill', d => {
            const val: string | number = this.colorAccessor(d.byYearMap.get(this.currYear))
            return this.colorScale(val);
          })
        , exit => exit.remove());
    this.circles
      .call(this.zoom.bind(this));
  }

  private zoom(): void {
    const circles = this.circles;
    const year = this.currYear;

    if (!circles) {
      return;
    }

    circles
      .transition('zoom').duration(environment.animationDuration)
      .attr('fill', d => this.colorScale(this.colorAccessor(d.byYearMap.get(year))))
      .attr('cx', d => this.xRange(this.xAccessor(d.byYearMap.get(year)) ?? 0))
      .attr('cy', d => this.yRange(this.yAccessor(d.byYearMap.get(year)) ?? 0));

    this.xAxis = axisBottom(this.xRange).ticks(12)
      .tickFormat(d => `${d}${MeasurementDimensionUnitMap.get(this.xAxisDimension)}`);
    this.yAxis = axisLeft(this.yRange).ticks(12)
      .tickFormat(d => `${d}${MeasurementDimensionUnitMap.get(this.yAxisDimension)}`);

    this.svg.select<SVGGElement>('.axis--x')
      .transition('zoom')
      .call(this.xAxis)
      .attr('transform', `translate(0,${this.yRange(0)})`);

    this.svg.select<SVGGElement>('.axis--y')
      .transition('zoom')
      .call(this.yAxis)
      .attr('transform', `translate(${this.xRange(0)}, 0)`);
  }

  private brushed(event: D3BrushEvent<GenericScatterData>): void {
    if (event.selection) {
      const dialogConfig: MatDialogConfig = {
          hasBackdrop: true,
          disableClose: false,
          width: '350px',
          data: {action: undefined, event},
        };

      this.brush.clear(this.brushGroup);
      const bounds = this.convertSelectionToZoomBounds(event.selection as TwoDSelection);

      let dialogRef: MatDialogRef<any, BrushDialogData>;
      if (this.userRole === 'user') {
        dialogRef = this.dialog.open(UserDimpvisBrushDialogComponent, dialogConfig);
      } else if (this.userRole === 'wizard') {
        dialogRef = this.dialog.open(BrushDialogComponent, dialogConfig);
      }

      dialogRef.afterClosed().subscribe(result => {
        this.handleDialogClose(result, bounds);
      });
    } else {
      if (!this.brushDoubleClickTimeout) {
        this.brushDoubleClickTimeout = window.setTimeout(() => {
          this.brushDoubleClickTimeout = null;
        }, 350);
        return;
      }
      this.zoomOut();
      this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'zoom out'), this.userRole);
    }
  }

  protected guidanceAfterAccept(suggestion: DimpVisSuggestion<DVT>) {
    if (suggestion.event.event === 'highlight') {
      this.synchroFixer.lineChartRemoveHighlight.next(true);
    }
  }

  private handleDialogClose(result: BrushDialogData, bounds: TwoDSelection): void {
    switch (result?.action) {
      // @ts-ignore: no-switch-case-fall-through
      case 'suggest zoom':
        const trackingEvent = new TrackingEvent(this.getComponent(), this.getName(), 'suggest zoom', bounds);
        const sugg = new DimpVisSuggestion('Zoom', this.getSuggestionDescription(trackingEvent.event, trackingEvent.value), trackingEvent);
        const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
        this.provenanceService.log(guidanceEvent, this.userRole);
        // this.suggestions.push(sugg);
        // this.suggestionLinkingService.addSuggestion(sugg);
      // no break because suggesting zooms should also zoom (and log the appropriate provenance messages).
      // @ts-ignore: no-switch-case-fall-through
      case 'zoom':
        this.zoomIn(bounds);
        const zoomInEvent = new TrackingEvent(this.getComponent(), this.getName(), 'zoom in', bounds);
        this.provenanceService.log(zoomInEvent, this.userRole);
        break;
      // @ts-ignore: no-switch-case-fall-through
      case 'suggest highlight':
        const ids = this.highlight(bounds);
        const hightlightTrackingEvent = new TrackingEvent(this.getComponent(), this.getName(), 'highlight', Array.from(ids));
        const highlightSugg = new DimpVisSuggestion('Highlight', `Highlight ${ids.size} cities`, hightlightTrackingEvent, 'orienting');
        const gE = new GuidanceInteractionEvent(highlightSugg, 'make', 'orienting');
        // there can only be one active highlight suggestion. Remove all old ones before adding the new one
        // this.suggestions = this.suggestions.filter(s => s.event.event !== 'highlight');
        // this.suggestions.push(highlightSugg);
        // this.suggestionLinkingService.removeSuggestions(this.getComponent(), e => e.event.event !== 'highlight')
        // this.suggestionLinkingService.addSuggestion(highlightSugg);
        this.provenanceService.log(gE, this.userRole);

        const hE = new TrackingEvent(this.getComponent(), this.getName(), 'highlight', Array.from(ids));
        this.provenanceService.log(hE, this.userRole);
        break;
      case 'highlight':
        const highlightIDs = this.highlight(bounds);
        const hhE = new TrackingEvent(this.getComponent(), this.getName(), 'highlight', Array.from(highlightIDs));
        this.provenanceService.log(hhE, this.userRole);
        // changing the highlights should automatically kill current highlight suggestions
        // this.suggestions = this.suggestions.filter(s => s.event.event !== 'highlight');
    }
  }

  private convertSelectionToZoomBounds([[x0, y0], [x1, y1]]: TwoDSelection): TwoDSelection {
    const x = [x0, x1].map(this.xRange.invert, this.xRange) as [number, number];
    const y = [y1, y0].map(this.yRange.invert, this.yRange) as [number, number];
    return [x, y];
  }

  private zoomIn([x, y]: TwoDSelection): void {
    this.xRange.domain(x);
    this.yRange.domain(y);

    this.zoom();
  }

  private zoomOut(): void {
    this.xRange.domain(this.xAxisExtent);
    this.yRange.domain(this.yAxisExtent);

    this.zoom();
  }

  private highlight(sel: TwoDSelection): Set<string> {
    // let [[x0, y0], [x1, y1]] = sel;
    // [x0, x1] = [x0, x1].map(this.xRange.invert);
    // [y1, y0] = [y0, y1].map(this.yRange.invert);

    const ids = new Set<string>();
    const [[x0, x1], [y0, y1]] = sel;
    this.circles.each(d => {
      const data = d.byYearMap.get(this.currYear);
      if (data && x0 <= this.xAccessor(data) && this.xAccessor(data) <= x1 && y0 <= this.yAccessor(data) && this.yAccessor(data) <= y1) {
          ids.add(data.station);
      }});

    this.highlightedIDsChange.emit(ids);
    this.synchroFixer.lineChartRemoveHighlight.next(true);
    this.highlightIDs(ids);
    this.highlightedIDs = ids;
    return ids;
  }

  private highlightIDs(ids: Set<string>): void {
    this.circles?.filter(d => ids.has(d.station)).raise();
    this.circles?.transition().duration(environment.animationFastDuration)
      .attr('stroke', d => ids.has(d.station) ? 'yellow' : null)
      .attr('filter', d => ids.has(d.station) ? 'url(#lightblur)' : null);
      // .attr('stroke-width', d => ids.has(d.station)? '2px' : '2px');

  }

  private removeHighlight(): void {
    this.circles?.transition().duration(environment.animationFastDuration)
      .attr('stroke', null);
  }

  private addFlashlightTrail(d: Map<Date, Measurement>, external = false): void {
    const l = line<Measurement>()
      .x(e => this.xRange(this.xAccessor(e)))
      .y(e => this.yRange(this.yAccessor(e)));

    this.circles
      .transition().duration(environment.animationFastDuration)
      .style('opacity', e => e.byYearMap === d ? 1 : 0.2);

    const radius = 4;

    this.flashlightGroup.append('path')
      .attr('d', l(d.values()) ?? '')
      .attr('stroke', '#2c79d7')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#blur)')
      .attr('fill', 'none');

    d.forEach((val, key) => {
      this.flashlightGroup.append('text')
        .attr('transform', `translate(${this.xRange(this.xAccessor(val)) + radius}, ${this.yRange(this.yAccessor(val)) + radius})`)
        .attr('fill', 'white')
        .attr('stroke', 'white')
        .attr('stroke-width', '4px')
        .attr('font-size', 12)
        .text(`${(('0' + (key.getMonth() + 1)).slice(-2))}/${key.getFullYear()}`);

      this.flashlightGroup.append('text')
        .attr('transform', `translate(${this.xRange(this.xAccessor(val)) + radius}, ${this.yRange(this.yAccessor(val)) + radius})`)
        .attr('fill', '#2c79d7')
        .attr('stroke', 'none')
        .attr('font-size', 12)
        .text(`${(('0' + (key.getMonth() + 1)).slice(-2))}/${key.getFullYear()}`);

      this.flashlightGroup.append('circle')
        .attr('transform', `translate(${this.xRange(this.xAccessor(val))}, ${this.yRange(this.yAccessor(val))})`)
        .attr('fill', '#2c79d7')
        .attr('r', 4)
        .style('pointer-events', 'none');
    });

    // if (!external && this.userRole === 'user') {
    if (!external) {
      this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'flashlight on', d), this.userRole);
    }
  }

  private removeFlashlightTrail(external = false): void {
    // if (!external && this.userRole === 'user') {
    if (!external) {
      this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'flashlight off'), this.userRole);
    }
    this.flashlightGroup.selectAll('*').remove();
    this.circles
      .transition().duration(environment.animationFastDuration)
      .style('opacity', 1);
  }
}


export type TwoDSelection = [[number, number], [number, number]];
export type FlashlightData = {Date: Measurement};

type DVT = TwoDSelection | FlashlightData | string[];
