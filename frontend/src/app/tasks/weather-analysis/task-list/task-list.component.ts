import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UserRole, UserRoleService } from '../../../services/study/user-role.service';
import { StudyTask, TaskService } from '../../../services/task.service';
import { MatStepper } from '@angular/material/stepper';
import { WebSocketServiceService } from '../../../services/web-socket-service.service';
import { ChannelService } from '../../../services/channel/channel.service';
import {
  GuidanceInteractionEvent,
  GuidanceLinkingEvent,
  ProvenanceService, TaskCompleteEvent,
  TrackingEvent
} from '../../../services/provenance.service';
import { CandidateListService } from '../../../services/candidate-list.service';
import { Router } from '@angular/router';

@Component({
  selector: 'gs-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {

  @Input() isOverlay = false;
  userRole: UserRole;

  taskList: StudyTask[];
  activeTask: StudyTask;

  taskDifficulty: number;
  guidanceQuality: number;

  taskStartDate: Date = new Date();
  taskCompletionDate: Date;

  showLikert = false;
  showReminder = false;
  pleaseContinueWarning = false;

  @ViewChild('stepper') stepper: MatStepper;

  constructor(private userRoleService: UserRoleService,
              private taskListService: TaskService,
              private channelService: ChannelService,
              private provenanceService: ProvenanceService<any>,
              private candidateListService: CandidateListService,
              private router: Router) { }

  ngOnInit(): void {
    this.userRole = this.isOverlay ? 'user' : this.userRoleService.role.value;
    this.taskListService.getTasks(this.userRole).subscribe(tasks => {
      this.taskList = tasks;
    });

    this.activeTask = this.taskListService.activeTask;

    this.channelService.messages$.subscribe(message => {
      if (this.isOverlay || message.type != 'taskComplete' || message.role === this.userRole) {
        return;
      }

      const taskCompleteMessage = message as TaskCompleteEvent;
      console.log(taskCompleteMessage);

      if (taskCompleteMessage.task === this.activeTask.id) {
        this.next(true);
      } else {
        console.warn('got outdated task complete message');
      }
    });
  }

  next(external = false): void {
    if (!this.showLikert) {
      this.showLikert = true;
      if (external) {
        this.pleaseContinueWarning = true;
      } else {
        this.provenanceService.log(new TaskCompleteEvent(), this.userRole);
      }
      this.taskCompletionDate = new Date();
      return;
    }

    this.pleaseContinueWarning = false;
    this.provenanceService.storeCandidates(this.candidateListService.candidates.join(", "), this.userRole, this.taskStartDate, this.taskCompletionDate)
      .subscribe(success => {
        console.log(success);
      })
    this.provenanceService.storeLikertResults(this.taskDifficulty, this.guidanceQuality, this.userRole, this.taskStartDate, this.taskCompletionDate)
      .subscribe(r => {
        console.log(r);
        this.taskDifficulty = undefined;
        this.guidanceQuality = undefined;
        this.taskStartDate = new Date();
      }, err => {

      })
    this.taskCompletionDate = undefined;
    this.stepper.next();
    const newTask = this.taskList[this.stepper.selectedIndex];

    if (newTask !== undefined) {
      this.taskListService.activeTask = newTask;
    } else {
      this.taskListService.activeTask = undefined;
      // this.channelService.disconnect();
      this.router.navigate(['/tlx']);
    }
    this.showLikert = false;
  }

  previous(): void {
    this.stepper.previous();
  }

}
