import { Injectable } from '@angular/core';
import { IEvent, ProvenanceService } from './provenance.service';
import { Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { UserRole, UserRoleService } from './study/user-role.service';

@Injectable({
  providedIn: 'root'
})
export class MouseTrackerService {
  mouseMove: Subject<TrackingMouse>;

  constructor(private provenanceService: ProvenanceService<null>,
              private userRoleService: UserRoleService) {
    this.mouseMove = new Subject<TrackingMouse>();
    this.mouseMove
      .pipe(throttleTime(TRACKING_DELAY))
      .subscribe(e => {
        this.provenanceService.log(e, userRoleService.role.value);
      });
    document.addEventListener('mousemove', this.debouncedlistener);
    document.addEventListener('click', this.directLoggerListener);
  }

  debouncedlistener = (e: MouseEvent) => {
    this.mouseMove.next(new TrackingMouse(e.x, e.y + window.scrollY, e.type as TrackingMouseType));
  }

  directLoggerListener = (e: MouseEvent) => {
    this.provenanceService.log(new TrackingMouse(e.x, e.y + window.scrollY, e.type as TrackingMouseType), this.userRoleService.role.value);
  }
}

export class TrackingMouse extends IEvent<null> {
  x: number;
  y: number;

  constructor(x: number, y: number, type: TrackingMouseType) {
    super();
    this.x = x;
    this.y = y;
    this.type = type;
    this.time = +new Date();
  }
}

type TrackingMouseType = 'click' | 'mousemove';


export const TRACKING_DELAY = 50;
