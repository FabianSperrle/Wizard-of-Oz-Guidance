import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { geoMercator, geoPath, json, scaleOrdinal, schemeCategory10, select, Selection } from 'd3';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';
import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { TrackableVisualizationComponent } from '../trackable-visualization.component';
import { Event, GuidanceInteractionEvent, ProvenanceService, TrackingEvent } from '../../services/provenance.service';
import { UserRole, UserRoleService } from '../../services/study/user-role.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  ContinentSelectionDialogComponent,
  ContinentSelectionDialogData
} from './continent-selection-dialog/continent-selection-dialog.component';
import { DimpVisSuggestion } from '../suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';
import { OverlaySynchroService } from '../../services/overlay-synchro.service';
import { ChannelService } from '../../services/channel/channel.service';
import { SuggestionLinkServiceService } from '../../services/suggestion-link-service.service';
import { SynchroFixerService } from '../../services/synchro-fixer.service';

@Component({
  selector: 'gs-world-map',
  templateUrl: './world-map.component.html',
  styleUrls: ['./world-map.component.scss']
})
export class WorldMapComponent extends TrackableVisualizationComponent<string[]> implements AfterViewInit {

  @Output() selectedContinents = new EventEmitter<SuggestionContinentWrapper>();
  @Output() selectedContinentsPreview = new EventEmitter<SuggestionContinentWrapper>();
  @ViewChild('svgContainer', {static: true}) svgContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('map', {static: true}) svgRef: ElementRef<SVGSVGElement>;
  svg: Selection<SVGSVGElement, any, any, any>;
  userRole: UserRole;
  private width = 400;
  private height = 200;
  private padding = {left: 30, right: 30, top: 30, bottom: 0};
  private _selectedContinents: Set<string> = new Set<string>();
  private _userContinents: UserContinentWrapper = new UserContinentWrapper(new Set(defaultContinents), 'update continents');
  private selectedBeforePreview: Set<string>;

  get userContinents(): UserContinentWrapper {
    return this._userContinents;
  }

  set userContinents(value: UserContinentWrapper) {
    this._userContinents = value;
  }

  constructor(channelService: ChannelService,
              overlaySynchro: OverlaySynchroService,
              provenanceService: ProvenanceService<string[]>,
              userRoleService: UserRoleService,
              suggestionLinkingService: SuggestionLinkServiceService,
              dialog: MatDialog,
              private synchroFixer: SynchroFixerService) {
    super(channelService, overlaySynchro, provenanceService, userRoleService, suggestionLinkingService, dialog);

    this.synchroFixer.mapRemoveContinentEmitter.subscribe(_ => this._userContinents.emitOnSync = false);
  }

  ngAfterViewInit(): void {
    this.setupUserRole();

    const boundingClientRect: DOMRect = this.svgContainer.nativeElement.getBoundingClientRect();
    const boundingWidth = boundingClientRect.width;
    const padding = this.padding.left + this.padding.right;
    this.width = this.isOverlay ? (boundingWidth - .2 * padding) * 5 : boundingWidth - padding;

    this.svg = select(this.svgRef.nativeElement)
      .attr('width', this.width + this.padding.left + this.padding.right)
      .attr('height', this.height + this.padding.top + this.padding.bottom);

    const projection = geoMercator()
      .scale(this.width / 1.8 / Math.PI)
      .translate([this.width / 2 + 20, this.height / 2 + 60])
      .rotate([-10, 0]);

    const path = geoPath().projection(projection);
    const data = 'https://piwodlaiwo.github.io/topojson//world-continents.json';


    json(data).then((topology: Topology) => {
      const fc = feature(topology, topology.objects.continent) as FeatureCollection;
      const continentsWithDuplicates = fc.features;
      const continentMap = new Map<string, Feature>();
      continentsWithDuplicates.forEach(c => continentMap.set(c.properties.continent, c));
      const continents = Array.from(continentMap.values());

      continents.forEach(c => this._selectedContinents.add(c.properties.continent));
      const color = scaleOrdinal(schemeCategory10)
        .domain(defaultContinents)

      this.svg.selectAll('path')
        .data(continents)
        .join('path')
        .attr('d', path)
        .attr('title', (d) => d.properties.continent)
        .style('fill', (d, i) => color(d.properties.continent))
        .style('fill-opacity', 1)
        .attr('stroke', 'black')
        .style('cursor', 'pointer')
        // ts-ignore: only-arrow-functions
        .on('mouseenter', function(): void {
          select(this).attr('stroke', 'black')
            .style('fill-opacity', 1);
        })
        .on('mouseleave', () => this.updateContinents())
        .on('click', (event, d) => {
          if (this.userRole === 'user') {
            const wasRemoved = this.handleContinentClick(d);
            const e: Event = wasRemoved ? 'remove continent' : 'add continent';
            this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), e, this.continentsToJSON()), this.userRole);
          } else if (this.userRole === 'wizard') {
            const dialogRef: MatDialogRef<ContinentSelectionDialogComponent, ContinentSelectionDialogData> = this.dialog.open(ContinentSelectionDialogComponent, {
              hasBackdrop: true,
              disableClose: false,
              width: '350px',
              data: {action: undefined, event},
            });

            dialogRef.afterClosed().subscribe(result => {
              const wasRemoved = this.handleContinentClick(d);
              const e: Event = wasRemoved ? 'remove continent' : 'add continent';
              switch (result?.action) {
                // @ts-ignore: no-switch-case-fall-through
                case 'suggest change':
                  const trackingEvent = new TrackingEvent<string[]>(this.getComponent(), this.getName(), e, this.continentsToJSON());
                  const sugg  = new DimpVisSuggestion<string[]>('Toggle', this.getSuggestionDescription(e, d), trackingEvent);
                  const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
                  this.provenanceService.log(guidanceEvent, this.userRole);
                // no break because suggesting zooms should also zoom (and log the appropriate provenance messages).
                // @ts-ignore: no-switch-case-fall-through
                case 'change':
                  const zoomInEvent = new TrackingEvent(this.getComponent(), this.getName(), e, this.continentsToJSON());
                  this.provenanceService.log(zoomInEvent, this.userRole);
                  break;
              }
            });
          }
        });
    });
  }

  resetToDefaultSettings() {
    this._selectedContinents = new Set(defaultContinents);
    this.selectedContinents.emit({continents: this._selectedContinents, action: 'update continents'});
    this.updateContinents();
  }

  getComponent(): string {
    return 'worldmap';
  }

  getName(): string {
    return 'm1';
  }

  processEvent(message: TrackingEvent<string[]>, isSynchroUpdate = false): void {
    // before potentially exiting, save last user event for later synchro
    this.saveUserEventForSynchro(message);

    if (this.userRole === 'wizard' && !isSynchroUpdate) {
      return;
    }

    switch (message.event) {
      case 'add continent':
      case 'remove continent':
      case 'update continents':
        this._selectedContinents = new Set(message.value);
        this.selectedContinents.next({continents: this._selectedContinents, action: message.event});
        this.updateContinents();
        break;
      case 'reset':
        this.resetToDefaultSettings();
        break;
    }
  }

  resetToDefault() {
    this.syncResetToDefault();
    this.resetToDefaultSettings();
  }

  saveUserEventForSynchro(message: TrackingEvent<string[]>) {
    if (message.event === 'reset') {
      this._userContinents = new UserContinentWrapper(new Set(defaultContinents), 'update continents');
      this._userContinents.emitOnSync = false;
    } else {
      this._userContinents = new UserContinentWrapper(new Set(message.value), message.event);
      this._userContinents.emitOnSync = false;
    }
    this.synchroFixer.storeContinentForSynchro.next({continents: this._userContinents.continents, action: message.event === 'reset' ? 'update continents' : message.event });
  }

  protected guidanceAfterAccept(suggestion: DimpVisSuggestion<string[]>) {
    this.selectedContinents.next({continents: this._selectedContinents, action: suggestion.event.event});
  }

  guidanceMake(suggestion): void {
  }

  guidancePreviewEnd(suggestion: DimpVisSuggestion<string[]>): void {
    this._selectedContinents = new Set(this.selectedBeforePreview);
    this.selectedContinentsPreview.next(null);
    this.updateContinents();
  }

  guidancePreviewStart(suggestion: DimpVisSuggestion<string[]>): void {
    this.selectedBeforePreview = new Set(this._selectedContinents);
    this._selectedContinents = new Set(suggestion.event.value);
    this.selectedContinentsPreview.next({continents: this._selectedContinents, action: suggestion.event.event});
    this.updateContinents();
  }

  synchronize(): void {
    this._selectedContinents = new Set(this._userContinents.continents);
    if (this._userContinents.emitOnSync) {
      console.warn('world map is still sending synchro?!');
      this.selectedContinents.next({ continents: this._selectedContinents, action: this._userContinents.action });
    }
    this.updateContinents();
  }

  handleNewSuggestion() {
    const trackingEvent = new TrackingEvent<string[]>(this.getComponent(), this.getName(), 'update continents', this.continentsToJSON());
    const sugg  = new DimpVisSuggestion<string[]>('Toggle', this.getSuggestionDescription(), trackingEvent);
    const guidanceEvent = new GuidanceInteractionEvent(sugg, 'make', 'directing');
    this.provenanceService.log(guidanceEvent, this.userRole);
  }

  getSuggestionDescription(event?: Event, d?: Feature<Geometry, GeoJsonProperties>) {
    if (event && d) {
      return `${event === 'add continent' ? 'Add' : 'Remove'} ${d.properties.continent}`;
    }
    const continents = this.continentsToJSON();
    switch (continents.length) {
      case 6:
        return `Select all continents`;
      case 0:
        return `Select no continents`;
      default:
        return `Select ${continents.join(', ')}`
    }
  }

  private continentsToJSON(): string[] {
    return Array.from(this._selectedContinents.values());
  }

  private handleContinentClick(d: Feature<Geometry, GeoJsonProperties>): boolean {
    const continent = d.properties.continent;
    let removed = false;
    if (this._selectedContinents.has(continent)) {
      this._selectedContinents.delete(continent);
      removed = true;
    } else {
      this._selectedContinents.add(continent);
    }
    this.updateContinents();
    this.selectedContinents.next({continents: new Set(this._selectedContinents), action: removed ? 'remove continent' : 'add continent'});
    return removed;
  }

  private updateContinents() {
    this.svg?.selectAll<SVGPathElement, Feature<Geometry, GeoJsonProperties>>('path')
      .attr('stroke', d => this._selectedContinents.has(d.properties.continent) ? 'black' : 'none')
      .style('fill-opacity', d => this._selectedContinents.has(d.properties.continent) ? 1 : 0.6);
  }
}

class UserContinentWrapper {
  private _continents: Set<string>;
  emitOnSync = true;
  action: Event;

  constructor(continents: Set<string>, action: Event) {
    this._continents = new Set(continents);
    this.action = action;
  }


  get continents(): Set<string> {
    return this._continents;
  }

  set continents(value: Set<string>) {
    this._continents = value;
  }
}

export interface SuggestionContinentWrapper {
  continents: Set<string>;
  action: Event;
}

export const defaultContinents = ['South America', 'Oceania', 'North America', 'Europe', 'Asia', 'Africa']
