import { Component, OnInit } from '@angular/core';
import { ProvenanceService } from '../../../services/provenance.service';
import { Router } from '@angular/router';
import { ChannelService } from '../../../services/channel/channel.service';
import { UserRoleService } from '../../../services/study/user-role.service';

@Component({
  selector: 'gs-tlx',
  templateUrl: './tlx.component.html',
  styleUrls: ['./tlx.component.scss']
})
export class TLXComponent {

  mental: number;
  temporal: number;
  performance: number;
  effort: number;
  frustration: number;

  constructor(private provenanceService: ProvenanceService<any>,
              private router: Router,
              private channelService: ChannelService,
              private roleService: UserRoleService) { }

  submit() {
    this.provenanceService.submitTLX(this.mental, this.temporal, this.performance, this.effort, this.frustration, this.roleService.role.getValue()).subscribe(res => {
      this.router.navigate(['/']);
      this.channelService.disconnect();
    })
  }

}
