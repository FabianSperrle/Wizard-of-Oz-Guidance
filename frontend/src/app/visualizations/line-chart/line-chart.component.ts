import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Measurement, MeasurementDimensionUnitMap } from '../../services/data/weatherdata.service';
import { UserRoleService } from '../../services/study/user-role.service';
import { safeExtent } from '../../utils/utils';
import {
  axisBottom,
  axisLeft, BrushBehavior,
  brushY,
  D3BrushEvent,
  extent,
  interpolateRdBu,
  line,
  mean,
  rollup,
  scaleLinear,
  ScaleLinear,
  scaleOrdinal,
  scaleSequential,
  schemeCategory10,
  select,
  Selection, timeFormat,
  timeMonth
} from 'd3';
import { Event, GuidanceInteractionEvent, ProvenanceService, TrackingEvent } from '../../services/provenance.service';
import { environment } from '../../../environments/environment';
import { ChannelService } from '../../services/channel/channel.service';
import { OverlaySynchroService } from '../../services/overlay-synchro.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  LineChartBrushDialogComponent,
  LineChartBrushDialogData
} from './line-chart-brush-dialog/line-chart-brush-dialog.component';
import { TrackableVisualizationComponent } from '../trackable-visualization.component';
import { StationTooltipComponent } from '../dimpvis/station-tooltip/station-tooltip.component';
import { TooltipService } from '../../services/tooltip.service';
import {
  MeasurementColorDimension,
  MeasurementDimension
} from '../../tasks/weather-analysis/weather-analysis.component';
import { defaultContinents } from '../world-map/world-map.component';
import { SuggestionLinkServiceService } from '../../services/suggestion-link-service.service';
import { DimpVisSuggestion } from '../suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';
import { TwoDSelection } from '../dimpvis/dimpvis.component';
import { SynchroFixerService } from '../../services/synchro-fixer.service';

@Component({
  selector: 'gs-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent extends TrackableVisualizationComponent<LineChartProvenanceData> implements AfterViewInit {
  @Input() data: Measurement[];
  width = 400;
  height = 300;
  @Output() currYearChange = new EventEmitter<Date>();
  @Output() highlightedIDsChange = new EventEmitter<Set<string>>();
  @ViewChild('svgContainer', {static: true}) svgContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('linechart', {static: true}) svgRef!: ElementRef<SVGSVGElement>;
  latestUserEventsForSynchro = new Map<Event, TrackingEvent<LineChartProvenanceData>>();
  private svg!: Selection<SVGSVGElement, any, any, any>;
  private lines: Selection<SVGPathElement, LineChartData, any, null>;
  private linkingLine: Selection<SVGPathElement, any, SVGSVGElement, null>;
  private xRange: ScaleLinear<number, number> = scaleLinear();
  private yRange: ScaleLinear<number, number> = scaleLinear();
  private yAxisExtent: [number, number] = [0, 0];
  private xAxis = axisBottom(this.xRange).ticks(12);
  private yAxis = axisLeft(this.yRange).ticks(12);
  private padding = {left: 50, right: 15, top: 30, bottom: 0};
  private svgXAxisOffset: number;
  private minMonth: Date;
  private defaultYDim: MeasurementDimension;
  private brushBehavior: BrushBehavior<LineChartData>;

  constructor(userRoleService: UserRoleService,
              channelService: ChannelService,
              overlaySynchro: OverlaySynchroService,
              dialog: MatDialog,
              provenanceService: ProvenanceService<[number, number]>,
              private toolTipService: TooltipService,
              private synchroFixer: SynchroFixerService,
              suggestionLinkingService: SuggestionLinkServiceService) {
    super(channelService, overlaySynchro, provenanceService, userRoleService, suggestionLinkingService, dialog);
    this.synchroFixer.lineChartRemoveHighlight.subscribe(_ => {
      console.log(this.userRole, this.isOverlay, this.getComponent(), 'deleting highlight synchro info');
      this.latestUserEventsForSynchro.delete('linechart brush');
    })
  }

  private _colorDimension: MeasurementColorDimension;

  get colorDimension(): MeasurementColorDimension {
    return this._colorDimension;
  }

  @Input() set colorDimension(value: MeasurementColorDimension) {
    this._colorDimension = value;
    this.colorAccessor = (d: Measurement) => d[this.colorDimension];
    this.updateChart();
  }

  _highlightedIDs: Set<string> = new Set<string>();
  get highlightedIDs(): Set<string> {
    return this._highlightedIDs;
  }
  @Input()
  set highlightedIDs(value: Set<string>) {
    this._highlightedIDs = value ?? new Set();
    this.highlightById();
  }

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
    this.updateChart();
  }
  @Output() yAxisDimensionChange = new EventEmitter<MeasurementDimension>();

  private _currYear: Date;
  get currYear(): Date {
    return this._currYear;
  }

  @Input()
  set currYear(value: Date) {
    this._currYear = value;
    if (this.data && this.svg) {
      this.updateLinkingLine();
    }
  }

  private _selectedStations: Set<string> = new Set();
  get selectedStations(): Set<string> {
    return this._selectedStations;
  }
  @Input() set selectedStations(value: Set<string>) {
    this._selectedStations = value;
    this.updateChart();
  }

  getComponent(): string {
    return 'linechart';
  }

  getName(): string {
    return 'l1';
  }

  synchronize(): void {
    if (this.latestUserEventsForSynchro.has('reset')) {
      this.resetToDefaultSettings();
      this.latestUserEventsForSynchro.delete('reset');
    }
    this.latestUserEventsForSynchro.forEach((value, key) => {
      this.processEvent(value, true);
    });
  }

  ngAfterViewInit(): void {
    this.setupUserRole();

    const boundingClientRect: DOMRect = this.svgContainer.nativeElement.getBoundingClientRect();
    this.svgXAxisOffset = boundingClientRect.x;
    const boundingWidth = boundingClientRect.width;
    const padding = this.padding.left + this.padding.right;
    this.width = this.isOverlay ? (boundingWidth - 0.2*padding) * 5 : boundingWidth - padding;

    this.svg = select(this.svgRef.nativeElement)
      .attr('width', this.width + this.padding.left + this.padding.right)
      .attr('height', this.height + this.padding.top + this.padding.bottom);

    // this.flashlightGroup = this.svg.append('g')
    //   .attr('id', 'flashlight');

    this.brushBehavior = brushY<LineChartData>()
      .on('end', this.brushed.bind(this));

    this.svg.select('#brush')
      // .attr('transform', `translate(${this.padding.top}, ${this.padding.left})`)
      .attr('class', 'brush')
      .call(this.brushBehavior);

    if (this.isOverlay) {
      this.svg.select('rect.overlay')
        .style('pointer-events', 'none!important');
    }

    this.yAxisExtent = safeExtent(extent(this.data, this.yAccessor));
    const [minM, maxMonth] = extent(this.data, d => d.date);
    const numberOfMonths = timeMonth.count(minM, maxMonth);
    this.minMonth = minM;


    this.xRange.domain([0, numberOfMonths]).range([this.padding.left, this.width + this.padding.right]);
    this.yRange.domain(this.yAxisExtent).range([this.height, this.padding.top]);

    this.initChart();
    this.updateChart();
  }

  protected storeDefaultSettings() {
    this.defaultYDim = this.yAxisDimension;
  }

  resetToDefault() {
    this.resetToDefaultSettings();
    this.syncResetToDefault();
  }

  resetToDefaultSettings() {
    this.yAxisDimension = this.defaultYDim;
    this.yAxisDimensionChange.emit(this.yAxisDimension);

    this.highlightedIDs = new Set();
    this.highlightedIDsChange.emit(this.highlightedIDs);
    this.synchroFixer.dimpvisRemoveHighlight.next(true);
  }

  initChart(): void {
    // this.currYear ??= this.data?.[0]?.date;
    // if (this.currYear === undefined) {
    //   console.error(this.data, this.currYear);
    //   throw new Error('Invalid data or startYear!');
    // }
    //
    this.svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0, ${this.height})`);
    this.svg.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', `translate(${this.padding.left}, 0)`);

    this.svg.append('line')
      .attr('id', 'linkingLine')
      .attr('stroke', 'black')
      .attr('stroke-width', '2px')
      .attr('fill', 'none')
      .attr('x0', 0)
      .attr('x1', 0)
      .attr('y0', this.yRange.range()[1])
      .attr('y1', this.yRange.range()[0] + 30);
  }

  updateChart(): void {
    if (!this.svg || !this.data) {
      return;
    }

    const dataForRollup = this.data.filter(d => this.selectedStations.has(d.station));
    const byStation: Map<string, LineChartData> = rollup(dataForRollup,
      d => {
        return {
          values: d.sort((a, b) => a.date.getTime() - b.date.getTime()).map(e => this.yAccessor(e)),
          station: d[0].station,
          continent: d[0].continent
        };
      },
      d => d.station);

    let color: any;
    let yAttributeValues: Map<string, any> = new Map();
    if (this.colorDimension === 'continent') {
      color = scaleOrdinal(schemeCategory10)
        .domain(defaultContinents);
      byStation.forEach((val, station) => yAttributeValues.set(station, val.continent));
    } else {
      yAttributeValues = rollup(dataForRollup, d => mean(d.map(e => this.colorAccessor(e)) as number[]), d => d.station)
      const [minY, maxY] = extent(yAttributeValues.values());

      color = scaleSequential(interpolateRdBu)
        .domain([maxY, minY]);
    }

    const l = line<number>()
      .x((d, i) => this.xRange(i))
      .y(d => this.yRange(d));

    this.lines = this.svg.select('#lines').selectAll<SVGPathElement, LineChartData>('path.chart-line')
      .data(Array.from(byStation.values()), d => d.station)
      .join(enter =>
          enter.append('path')
            .attr('class', 'chart-line')
            // .attr('d', d => l(d.values))
            .attr('fill', 'none')
            // .attr('stroke', d => color(yAttributeValues.get(d.station)))
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.3)
            .style('pointer-events', 'visibleStroke')
            .on('mouseenter', (e, d) => {
              const x = Math.floor(this.xRange.invert(e.x - this.svgXAxisOffset));
              const date = timeMonth.offset(this.minMonth, x);

              const tooltip = this.toolTipService.openTooltip(StationTooltipComponent, {x: e.x + 20, y: e.y + 20});
              tooltip.data = {
                station: {
                  name: d.station,
                  continent: d.continent
                },
                xDim: 'Date',
                xVal: `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`,
                yDim: this._yAxisDimension,
                yVal: d.values[x]
              };
            })
            .on('mouseleave', () => this.toolTipService.close()),
    update => update,
          exit => exit.remove()
      );
    this.lines.transition('zoom').duration(environment.animationDuration)
      .attr('stroke', d => color(yAttributeValues.get(d.station)))
      .attr('d', d => l(d.values));
    this.highlightById();

    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    this.xAxis = axisBottom(this.xRange).ticks(12)
      .tickFormat(d => shortMonths[d.valueOf()]);
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

  processEvent(event: TrackingEvent<LineChartProvenanceData>, isSynchroUpdate = false): void {
    // before potentially exiting, save last user event for later synchro
    this.saveUserEventForSynchro(event);
    console.log(this.latestUserEventsForSynchro);

    if (this.userRole === 'wizard' && !isSynchroUpdate) {
      if (event.event === 'linechart brush') {
        console.log(this.userRole, this.isOverlay, this.getComponent(), 'processed highlight');
        this.synchroFixer.dimpvisRemoveHighlight.next(true);
      }
      return;
    }

    switch (event.event) {
      case 'linechart brush':
        this.highlightedIDs = new Set(event.value.ids);
        this.moveBrushToRange(event.value.bounds);
        this.boundsBeforePreview = event.value.bounds;
        this.highlightedIDsChange.next(this.highlightedIDs);
        console.log(this.userRole, this.isOverlay, this.getComponent(), 'processed highlight');
        // this.synchroFixer.dimpvisRemoveHighlight.next(true);
        break;
      case 'reset':
        this.resetToDefaultSettings();
        break;
    }
  }

  private highlightedBeforePreview: Set<string>;
  private boundsBeforePreview: [number, number];
  guidancePreviewStart(suggestion: DimpVisSuggestion<LineChartProvenanceData>): void {
    this.highlightedBeforePreview = new Set(this.highlightedIDs);
    this.moveBrushToRange(suggestion.event.value.bounds);
    const ids = new Set(suggestion.event.value.ids);
    this.highlightById(ids);
    this.highlightedIDsChange.next(ids);
  }

  guidancePreviewEnd(suggestion: DimpVisSuggestion<LineChartProvenanceData>): void {
    this.highlightedIDs = this.highlightedBeforePreview;
    this.highlightById();
    this.highlightedIDsChange.next(this.highlightedIDs);
    this.moveBrushToRange(this.boundsBeforePreview);
  }

  private moveBrushToRange(range: [number, number]): void {
    this.brushBehavior.move(this.svg.select('#brush'), range);
  }

  getSuggestionDescription([min, max]: [number, number]): string {
    return `Highlight ${this.yRange(min).toFixed(2)} <= y <= ${this.yRange(max).toFixed(2)}`;
  }

  protected saveUserEventForSynchro(event: TrackingEvent<LineChartProvenanceData>): void {
    if (event.event === 'reset') {
      this.latestUserEventsForSynchro.clear();
    }
    const syncedEvents: Event[] = ['linechart brush', 'reset'];
    if (syncedEvents.includes(event.event)) {
      this.latestUserEventsForSynchro.set('linechart brush', event);
    }
  }

  protected guidanceAfterAccept(suggestion: DimpVisSuggestion<LineChartProvenanceData>): void {
    this.highlightedIDsChange.next(this.highlightedIDs);
    this.synchroFixer.dimpvisRemoveHighlight.next(true);
  }

  private yAccessor: (d?: Measurement) => number = () => 0;

  private colorAccessor: (d?: Measurement) => number | string = () => 0;

  private updateLinkingLine(): void {
    this.svg.select('#linkingLine')
      .attr('transform', `translate(${this.xRange(timeMonth.count(this.minMonth, this.currYear))}, 0)`);
  }

  private brushed($event: D3BrushEvent<LineChartData>): void {
    if ($event.sourceEvent === undefined) {
      return;
    }
    const bounds = $event.selection as [number, number];
    this.boundsBeforePreview = bounds;
    if (this.userRole === 'user') {
      this.highlightedIDs = this.highlightedBrushedLines(bounds);
      const brushEvent = new TrackingEvent<LineChartProvenanceData>(this.getComponent(), this.getName(), 'linechart brush', {
        ids: Array.from(this.highlightedIDs),
        bounds: bounds,
        axis: this.yAxisDimension
      });
      this.provenanceService.log(brushEvent, this.userRole);
      this.highlightedIDsChange.next(this.highlightedIDs);
      this.synchroFixer.dimpvisRemoveHighlight.next(true);
    } else if (this.userRole === 'wizard') {
      const dialogRef: MatDialogRef<LineChartBrushDialogComponent, LineChartBrushDialogData> = this.dialog.open(LineChartBrushDialogComponent, {
        hasBackdrop: true,
        disableClose: false,
        width: '350px',
        data: {action: undefined, event: $event}
      });

      dialogRef.afterClosed().subscribe(result => {
        this.highlightedIDs = this.highlightedBrushedLines(bounds);
        const brushEvent = new TrackingEvent(this.getComponent(), this.getName(), 'linechart brush', {
          ids: Array.from(this.highlightedIDs),
          bounds: bounds,
          axis: this.yAxisDimension
        });
        switch (result?.action) {
          // @ts-ignore: no-switch-case-fall-through
          case 'suggest brush':
            const sugg = new DimpVisSuggestion('Brush', this.getSuggestionDescription(bounds), brushEvent);
            const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
            this.provenanceService.log(guidanceEvent, this.userRole);
            // this.suggestions.push(sugg);
            // no break because suggestions should also brush
          // @ts-ignore: no-switch-case-fall-through
          case 'brush':
            this.provenanceService.log(brushEvent, this.userRole);
            this.highlightedIDsChange.next(this.highlightedIDs);
            this.synchroFixer.dimpvisRemoveHighlight.next(true);
            break;
        }
      });
    }
  }

  private highlightedBrushedLines(selection: [number, number]): Set<string> {
    const ids = new Set<string>();
    if (selection) {
      const [maxY, minY] = selection.map(this.yRange.invert);
      this.lines.each(d => {
          const res = d.values.every(e => e >= minY && e <= maxY);
          if (res === true) {
            ids.add(d.station);
          }
        });
    }
    this.highlightById(ids);
    return ids;
  }

  private highlightById(ids: Set<string> = this.highlightedIDs): void {
    if (ids.size === 0) {
      this.lines?.transition().duration(environment.animationFastDuration)
        .attr('filter', null);
    } else {
      this.lines?.filter(d => !ids.has(d.station)).attr('filter', null);
      this.lines?.filter(d => ids.has(d.station)).raise()
        .transition().duration(environment.animationFastDuration)
        .attr('filter', 'drop-shadow(0px 0px 4px yellow)');
    }
  }
}

export interface LineChartData {
  values: number[];
  station: string;
  continent: string;
}

export interface LineChartProvenanceData {
  ids: string[],
  bounds: [number, number],
  axis: MeasurementDimension
}
