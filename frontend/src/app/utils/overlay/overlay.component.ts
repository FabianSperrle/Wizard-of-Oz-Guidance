import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ChannelService } from '../../services/channel/channel.service';
import { interpolate, select, Selection } from 'd3';
import { TRACKING_DELAY, TrackingMouse } from '../../services/mouse-tracker.service';
import { OverlaySynchroService } from '../../services/overlay-synchro.service';
import { GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { $e } from 'codelyzer/angular/styles/chars';
import { OverlayService } from '../../services/overlay.service';
import { ListScroll } from '../../services/scroll-synchronizer.service';

@Component({
  selector: 'gs-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements OnInit {

  @ViewChild('mouse', {static: true}) mouse: ElementRef<SVGSVGElement>;
  private svg: Selection<SVGSVGElement, any, any, any>;
  private circle: Selection<SVGCircleElement, any, any, any>;
  private outline: Selection<SVGCircleElement, any, any, any>;

  constructor(private channelService: ChannelService,
              private synchroService: OverlaySynchroService,
              private overlayService: OverlayService) {

    // channelService.messages$.subscribe(message => {
    //   if (message.type === 'scrollSync') {
    //     const m = message as ListScroll;
    //     switch (m.list) {
    //       case 'window':
    //         this.yOffset = m.top;
    //         this.mouseMove(null);
    //         break;
    //     }
    //   }
    // });
  }

  radius = 15;
  xOffset = -8;
  yOffset = -8;

  color = 'orange';
  isSmall = true;

  currentDragPosition: DragPosition;
  smallPosition: DragPosition;
  largePosition: DragPosition;


  ngOnInit(): void {
    // setTimeout(() => this.isSmall = !this.overlayService.appIsOnlyOverlay, 5000);

    this.svg = select(this.mouse.nativeElement)
      .attr('width', '1820')
      .attr('height', '1000');

    this.circle = this.svg.append('circle')
      .attr('r', this.radius)
      .attr('cx', -20)
      .attr('cy', -20)
      .attr('stroke', 'none')
      .attr('fill-opacity', .3)
      .attr('fill', this.color);

    this.outline = this.svg.append('circle')
      .attr('r', this.radius / 10)
      .attr('cx', -20)
      .attr('cy', -20)
      .attr('stroke', this.color)
      .attr('stroke-width', this.isSmall ? this.radius / 3 : 2)
      .attr('fill', 'none');


    this.channelService.messages$.subscribe(e => {
      if (e.type === 'mousemove') {
        this.mouseMove(e as TrackingMouse);
      } else if (e.type === 'click') {
        this.click(e as TrackingMouse);
      }
    });
  }

  private lastX: number;
  private lastY: number;
  mouseMove(event: TrackingMouse): void {
    if (event) {
      this.lastX = event.x;
      this.lastY = event.y;
    }

    this.circle.transition('move').duration(TRACKING_DELAY)
      .attr('cx', event?.x ?? this.lastX + this.xOffset)
      .attr('cy', event?.y ?? this.lastY + this.yOffset);
    this.outline.transition('move').duration(TRACKING_DELAY)
      .attr('stroke-width', this.isSmall ? this.radius / 3 : 2)
      .attr('cx', event?.x ?? this.lastX + this.xOffset)
      .attr('cy', event?.y ?? this.lastY + this.yOffset);
  }

  click(event: TrackingMouse): void {
    this.mouseMove(event);
    this.outline
      .attr('stroke-width', this.isSmall ? this.radius / 3 : 2)
      .attr('cx', event.x + this.xOffset)
      .attr('cy', event.y + this.yOffset)
      .attr('r', this.radius / 10)
      .transition()
      .duration(150)
      .attr('r', this.isSmall ? this.radius * 3 : this.radius * 1.2)
      .transition().duration(50)
      .attr('r', this.radius / 10);
  }

  syncUserSettings(): void {
    this.synchroService.syncNow();
    this.synchroService.syncNow();
  }

  toggleSize(): void {
    this.isSmall = !this.isSmall;
    if (!this.currentDragPosition) {
      return;
    }

    let pos: DragPosition;
    if (this.isSmall) {
      this.largePosition = {...this.currentDragPosition};
      pos = this.smallPosition ?? this.currentDragPosition;
    } else {
      this.smallPosition = {...this.currentDragPosition};
      pos = this.largePosition ?? this.currentDragPosition;
    }

    this.currentDragPosition = this.constrainPosition(pos);
  }

  dragEnded($event: CdkDragEnd): void {
    this.currentDragPosition = this.constrainPosition($event.source.getFreeDragPosition());
  }

  constrainPosition(pos: DragPosition): DragPosition {
    if (this.isSmall) {
      return {
        x: Math.max(pos.x, -760),
        y: Math.max(pos.y, -420)
      };
    } else {
      return {
        x: Math.max(pos.x, -90),
        y: Math.max(pos.y, -45)
      };
    }
  }


}

type DragPosition = {x: number, y: number};
