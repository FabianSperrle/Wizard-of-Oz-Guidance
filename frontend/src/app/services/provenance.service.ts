import { Injectable } from '@angular/core';
import { ChannelService } from './channel/channel.service';
import { UserRole } from './study/user-role.service';
import { TaskService } from './task.service';
import {
  DimpVisSuggestion,
  InteractionTypes
} from '../visualizations/suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudyCondition, StudyConditionService } from './study-condition.service';

@Injectable({
  providedIn: 'root'
})
export class ProvenanceService<T> {

  constructor(private channelService: ChannelService,
              private taskService: TaskService,
              private http: HttpClient,
              private conditionService: StudyConditionService) { }

  public log(event: IEvent<T>, role: UserRole): void {
    // console.log("provenanve", event);
    event.role = role;
    event.user = this.channelService.userID;
    event.task = this.taskService.activeTask?.id ?? 'unknown';
    event.condition = this.conditionService.condition;
    if (!this.channelService.selectedChannel) {
      // console.error("not currently subscribed to a socket correctly");
      return;
    }
    event.channel = this.channelService.selectedChannel.name;
    if (!event.time) {
      console.warn('event', event, 'does not have a timestamp');
      event.time = +new Date();
    }
    this.channelService.send(event);
  }

  public storeLikertResults(difficulty: number, guidance: number, role: UserRole, start: Date, end: Date): Observable<boolean> {
    const val = {
      user: this.channelService.userID,
      role: role,
      task: this.taskService.activeTask?.id ?? 'unknown',
      condition: this.conditionService.condition,
      channel: this.channelService.selectedChannel.name,
      difficulty: difficulty,
      guidance_quality: guidance,
      start: +start,
      end: +end
    };
    console.log(val);
    return this.http.post<boolean>(`${environment.backend}/likert/save`, val);
  }

  public storeCandidates(candidates: string, role: UserRole, start: Date, end: Date): Observable<boolean> {
    const val = {
      user: this.channelService.userID,
      role: role,
      task: this.taskService.activeTask?.id ?? 'unknown',
      condition: this.conditionService.condition,
      channel: this.channelService.selectedChannel.name,
      candidates: candidates,
      start: +start,
      end: +end
    };
    console.log(val);
    return this.http.post<boolean>(`${environment.backend}/candidates/save`, val);
  }

  public submitTLX(mental: number, temporal: number, performance: number, effort: number, frustration: number, role: UserRole): Observable<boolean> {
    const val = {
      user: this.channelService.userID,
      role: role,
      condition: this.conditionService.condition,
      channel: this.channelService.selectedChannel.name,
      mental: mental,
      temporal: temporal,
      performance: performance,
      effort: effort,
      frustration: frustration
    };
    console.log(val);
    return this.http.post<boolean>(`${environment.backend}/tlx/save`, val);
  }

}

export type Event = 'reset' |
  'click' | 'mouseover' | 'change' | 'flashlight on' | 'flashlight off' | 'zoom in' | 'zoom out' | 'suggest zoom' | 'highlight'
  | 'timeslide'
  | 'linechart brush'
  | 'axis select'
  | 'add continent' | 'remove continent' | 'update continents'
  | 'add station' | 'remove station' | 'star station' | 'remove star' | 'star->visible' | 'no star -> invisible' | 'invisible -> no star' | 'visible -> star' | 'show all' | 'hide all' | 'star all' | 'star none' | 'highlighted -> invisible' | 'not highlighted -> invisible';

export abstract class IEvent<T> {
  type: string;
  time: number;
  role: UserRole; // set by service
  user: string; // set by service
  channel: string; // set by service
  task: number | string; // set by service
  condition: StudyCondition; // set by service
}

export class TrackingEvent<T> extends IEvent<T> {
  component: string;
  name: string;
  value?: T;
  event: Event;
  type = 'tracking';

  constructor(component: string, name: string, event: Event, value?: T) {
    super();
    this.component = component;
    this.name = name;
    if (value instanceof Map) {
      console.log('got value map', value);
      this.value = Object.fromEntries(value);
    } else {
      this.value = value;
    }
    this.event = event;
    this.time = +new Date();
  }
}

export class GuidanceLinkingEvent extends IEvent<any> {
  ids: number[] = [];
  type = 'guidancelink';
  interaction: InteractionTypes;

  constructor(ids: number[], interaction: InteractionTypes) {
    super();
    this.ids = ids;
    this.interaction = interaction;
    this.time = +new Date()
  }
}

export class GuidanceInteractionEvent<T> extends IEvent<T> {
  suggestion: DimpVisSuggestion<T>;
  interaction: InteractionTypes;
  degree?: GuidanceDegree;
  type = 'guidance';
  value: T

  constructor(suggestion: DimpVisSuggestion<T>, interaction: InteractionTypes, degree?: GuidanceDegree) {
    super();
    this.suggestion = suggestion;
    this.interaction = interaction;
    if (this.interaction === 'make' && !degree) {
      throw new Error('New guidance events must contain a guidance degree');
    }
    this.degree = degree;
    this.time = +new Date();
    this.value = suggestion.event.value;
  }
}

export class TaskCompleteEvent extends IEvent<any> {
  type = 'taskComplete';
  time = +new Date();
}

export type GuidanceDegree = 'orienting' | 'directing' | 'prescribing';
