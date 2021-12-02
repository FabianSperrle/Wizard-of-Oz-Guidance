import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { TooltipService } from '../../../services/tooltip.service';

@Component({
  selector: 'gs-visualization-info-tooltip',
  templateUrl: './visualization-info-tooltip.component.html',
  styleUrls: ['./visualization-info-tooltip.component.scss']
})
export class VisualizationInfoTooltipComponent {

  @Input() template: TemplateRef<any>;

  constructor(private tooltipService: TooltipService) { }

  close() {
    this.tooltipService.close();
  }
}
