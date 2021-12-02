import { Component, OnInit } from '@angular/core';
import { ChannelService } from '../../services/channel/channel.service';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserRole, UserRoleService } from '../../services/study/user-role.service';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OverlayService } from '../../services/overlay.service';
import { StudyCondition, StudyConditionService } from '../../services/study-condition.service';

@Component({
  selector: 'gs-channel-manager',
  templateUrl: './channel-manager.component.html',
  styleUrls: ['./channel-manager.component.scss']
})
export class ChannelManagerComponent implements OnInit {

  channelFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(4),
    this.duplicateNAmeValidator()
  ]);


  constructor(public channelService: ChannelService,
              private snackBar: MatSnackBar,
              private userRoleService: UserRoleService,
              private router: Router,
              private overlayService: OverlayService,
              private studyConditionService: StudyConditionService) { }

  public newChannel: string;
  public channels: Channel[];

  ngOnInit(): void {
    this.channelService.getAvailableChannels().subscribe(c => this.channels = c);
  }

  public registerChannel(name: string): void {
    this.channelService.registerChannel(name).subscribe(c => this.channels = c,
        e => {
          console.log('error', e) ;
          this.snackBar.open(e.error?.detail ?? 'An error occurred while saving the channel. Please see the console for logs.', 'Ok');
        });
    this.newChannel = '';
  }

  deleteChannel(channel: Channel): void {
    this.channelService.deleteChannel(channel).subscribe(c => this.channels = c,
      err => console.error(err));
  }

  joinChannel(channel: Channel, user: UserRole, condition: StudyCondition): void {
    this.studyConditionService.condition = condition;
    console.log('trying to connect to channel', channel);
    this.channelService.connect(channel);
    if (user === 'overlay') {
      this.overlayService.appIsOnlyOverlay = true;
      this.userRoleService.role.next('wizard');
      this.router.navigate(['/t1user']);
    } else {
      this.userRoleService.role.next(user);
      this.router.navigate(['/t1']);
    }
  }

  duplicateNAmeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const forbidden = this.channels?.map(c => c.name).includes(control.value) ?? false;
      return forbidden ? {forbiddenName: {value: control.value}} : null;
    };
  }

}

export interface Channel {
  name: string;
}
