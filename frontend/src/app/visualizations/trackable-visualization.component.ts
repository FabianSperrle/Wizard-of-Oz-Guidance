import {
  GuidanceInteractionEvent,
  GuidanceLinkingEvent,
  IEvent,
  ProvenanceService,
  TrackingEvent
} from '../services/provenance.service';
import { UserRole, UserRoleService } from '../services/study/user-role.service';
import { ChannelService } from '../services/channel/channel.service';
import { OverlaySynchroService } from '../services/overlay-synchro.service';
import { Component, Directive, Input, OnInit } from '@angular/core';
import { SuggestionLinkServiceService } from '../services/suggestion-link-service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  SuggestionLinkingDialogComponent,
  SuggestionLinkingDialogComponentData
} from './shared/suggestion-linking-dialog/suggestion-linking-dialog.component';
import {
  DimpVisSuggestion,
  InteractionTypes
} from './suggestions/dimpvis-suggestion-card/dimpvis-suggestion-card.component';

@Directive()
// ts-ignore directive-class-suffix
export abstract class TrackableVisualizationComponent<T> implements OnInit {

  public userRole: UserRole;
  @Input() public isOverlay: boolean;
  public suggestions: DimpVisSuggestion<T>[] = [];

  public constructor(private channelService: ChannelService,
                     private overlaySynchro: OverlaySynchroService,
                     protected provenanceService: ProvenanceService<T>,
                     public userRoleService: UserRoleService,
                     private suggestionLinkingService: SuggestionLinkServiceService,
                     protected dialog: MatDialog) {

  }

  ngOnInit(): void {
    this.setupUserRole();
    this.storeDefaultSettings();

    this.channelService.messages$.subscribe(message => {
      if (!this.messageForCurrentComponent(message)) {
        return;
      }

      if (message.type === 'tracking' && (this.isOverlay || this.userRole === 'wizard')) {
        this.processEvent(message as TrackingEvent<T>, false);
      } else if (message.type === 'guidance') {
        const a = message as GuidanceInteractionEvent<T>;
        this.processGuidance(a.suggestion, a.interaction, a.role, true);
      } else if (message.type === 'guidancelink') {
        const a = message as GuidanceLinkingEvent;
        this.guidanceLink(a.ids, a.interaction, a.role, true);
      }
    });

    this.overlaySynchro.sync$.subscribe(_ => {
      if (!this.isOverlay) {
        // console.log(this.userRole, this.isOverlay, 'starting sync request');
        this.synchronize();
      }
    });

    this.suggestionLinkingService.getSuggestionsForComponent(this.getComponent(), this.getName(), this.isOverlay).subscribe(suggs => {
      this.suggestions = suggs
    });
  }

  /**
   * Is called from ngInit. Should store all settings that are relevant for this component to enable a later reset.
   */
  protected storeDefaultSettings(): void {}

  /**
   * Set all configuration to previously stored default configurations.
   */
  abstract resetToDefault(): void;

  syncResetToDefault(): void {
    this.provenanceService.log(new TrackingEvent(this.getComponent(), this.getName(), 'reset'), this.userRole);
  }

  setupUserRole(): void {
    this.userRole = this.isOverlay ? 'user' : this.userRoleService.role.value;
  }

  messageForCurrentComponent(message: IEvent<T>): boolean {
    if (message.type === 'tracking') {
      const tracking = message as TrackingEvent<T>;
      return tracking.component === this.getComponent() && tracking.name === this.getName();
    } else if (message.type === 'guidance') {
      const guidance = message as GuidanceInteractionEvent<T>;
      if ((guidance.suggestion.event.component === this.getComponent() && guidance.suggestion.event.name === this.getName()) ||
        ((guidance.interaction === 'accept') && this.componentHasLinkedSuggestion(guidance.suggestion))) {
        if (guidance.interaction === 'preview end' || guidance.interaction === 'preview start') {
          return this.isOverlay ? guidance.role === 'user' : guidance.role === 'wizard';
        }
        return true;
      }
    } else if (message.type === 'guidancelink') {
      return true;
    }
    return false;
  }

  componentHasLinkedSuggestion(suggestion: DimpVisSuggestion<T>): boolean {
    return this.suggestions.some(sugg => sugg.linkedSuggestions?.includes(suggestion.id));
  }

  /**
   * The name of the component. Will be used to determine whether a received socket message concerns the current component
   * and for logging purposes.
   */
  abstract getComponent(): string;

  /**
   * A unique name for the component in case there are multiple instances of the same component.
   */
  abstract getName(): string;

  /**
   * Process a TrackingEvent message received via the socket.
   * Mainly used to sync the wizard user view with what the user does.
   *
   * @param message the tracking event
   * @param isSynchroUpdate whether the event has been manually triggered by a user view synchro update request. In this
   * case, the message is also applied to the wizards views.
   */
  abstract processEvent(message: TrackingEvent<T>, isSynchroUpdate: boolean): void;

  /**
   * Trigger a synchro update for all stored events.
   */
  abstract synchronize(): void;

  /**
   * Handle new, incoming guidance suggestions
   * @param suggestion the suggestion
   */
  guidanceMake(suggestion: DimpVisSuggestion<T>): void {

  }

  /**
   * Handle starting a new guidance suggestion preview
   * @param suggestion the suggestion
   */
  abstract guidancePreviewStart(suggestion: DimpVisSuggestion<T>): void;

  /**
   * Handle ending a guidance suggestion preview
   * @param suggestion the suggestion
   */
  abstract guidancePreviewEnd(suggestion: DimpVisSuggestion<T>): void;

  protected guidanceRetract(suggestion: DimpVisSuggestion<T>): void {
    this.guidancePreviewEnd(suggestion);
  }

  protected abstract saveUserEventForSynchro(event: TrackingEvent<T>): void;

  protected guidanceAfterAccept(suggestion: DimpVisSuggestion<T>): void { }

  protected guidanceReject(suggestion: DimpVisSuggestion<T>): void {
    this.guidancePreviewEnd(suggestion);
  }

  /**
   * Handle a new guidance event
   * @param suggestion the suggestion
   * @param interaction the interaction type
   * @param initiator the user role that initiated the interaction
   * @param external whether the event came via the socket (=true) or from the suggestion card (=false)
   * @param isSynchro
   */
  public processGuidance(suggestion: DimpVisSuggestion<T>, interaction: InteractionTypes, initiator: UserRole, external = false, isSynchro = false): void {
    // suggestion.event = this.trackingEventManipulator(suggestion.event);
    switch (interaction) {
      case 'make':
        this.guidanceMake(suggestion);
        this.suggestionLinkingService.addSuggestion(suggestion, this.isOverlay);
        break;
      case 'accept':
        if (!external) {
          this.guidancePreviewEnd(suggestion);
          const ge = new GuidanceInteractionEvent(suggestion, 'accept');
          this.provenanceService.log(ge, this.userRole);
          this.suggestionLinkingService.copyActionForLinkedSuggestions(ge, this.isOverlay, this.userRole);
        }
        this.removeSuggestion(suggestion, true);

        if (external) {
          const localSugg = this.suggestions.find(s => s.id === suggestion.id)
          if (!suggestion.preview && (this.userRole == 'user' || this.isOverlay === true)) {
            this.guidancePreviewStart(suggestion);
          }
          if (!this.isOverlay) {
            this.saveUserEventForSynchro(suggestion.event);
          }
          // if (!this.isOverlay) {
          //   // this.suggestionLinkingService.copyActionForLinkedSuggestions(ge, this.isOverlay, 'user');
          //   // this.
          //   const linked = this.suggestions.filter(s => suggestion.linkedSuggestions?.includes(s.id));
          //   console.log('manual', this.userRole, this.isOverlay, this.getComponent(), 'has linked suggestions: ', linked, interaction);
          //   linked.forEach(s => this.processGuidance(s, interaction, 'user', true, true));
          // }
          // // if (!this.isOverlay) {
          //   this.removeSuggestion(suggestion);
          // // }
          break;
        }

        this.processEvent(suggestion.event, false);
        this.saveUserEventForSynchro(suggestion.event);
        this.guidanceAfterAccept(suggestion);
        break;
      case 'preview end':
        if (external) {
          // wizards never react to user preview events
          if (this.userRole === 'wizard' && !isSynchro) {
            break;
          } else if (this.userRole === 'user' && initiator === 'wizard') {
            break;
          }
        }

        suggestion.preview = false;
        this.guidancePreviewEnd(suggestion);
        if (!external) {
          const ge = new GuidanceInteractionEvent(suggestion, 'preview end');
          this.provenanceService.log(ge, this.userRole);
          this.suggestionLinkingService.copyActionForLinkedSuggestions(ge, this.isOverlay, this.userRole);
        }
        break;
      case 'preview start':
        if (external) {
          // wizards never react to user preview events
          if (this.userRole === 'wizard' && !isSynchro) {
            break;
          } else if (this.userRole === 'user' && initiator === 'wizard') {
            break;
          }
        }

        if (!external) {
          const ge = new GuidanceInteractionEvent(suggestion, 'preview start');
          this.provenanceService.log(ge, this.userRole);
          this.suggestionLinkingService.copyActionForLinkedSuggestions(ge, this.isOverlay, this.userRole);
        }
        suggestion.preview = true;
        this.guidancePreviewStart(suggestion);
        break;
      case 'reject':
        this.removeSuggestion(suggestion);
        // wizards don't see user previews
        if (this.userRole !== 'wizard') {
          this.guidancePreviewEnd(suggestion);
        }
        if (!external) {
          this.guidanceReject(suggestion);
          this.provenanceService.log(new GuidanceInteractionEvent(suggestion, 'reject'), this.userRole);
        } else if (suggestion.event.event === 'highlight') {
          this.guidanceReject(suggestion);
        }
        break;
      case 'retract':
        let hasLinkedSuggestions = false;
        if (!external) {
          this.guidanceRetract(suggestion);
          this.provenanceService.log(new GuidanceInteractionEvent(suggestion, 'retract'), this.userRole);
        } else {
          if (suggestion.event.event === 'highlight') {
            this.guidanceRetract(suggestion);
          } else {
            const localSugg = this.suggestions.find(s => s.id === suggestion.id)
            if (localSugg?.preview) {
              this.guidanceRetract(suggestion);
              if (localSugg.linkedSuggestions?.length > 0) {
                const ge = new GuidanceInteractionEvent(suggestion, 'retract');
                this.provenanceService.log(ge, this.userRole);
                this.suggestionLinkingService.copyActionForLinkedSuggestions(ge, this.isOverlay, this.userRole);
                hasLinkedSuggestions = true;
              }
            }
          }
        }
        this.removeSuggestion(suggestion, hasLinkedSuggestions);
        break;
      case 'link':
        if (external) {
          this.suggestionLinkingService.linkSuggestions(suggestion.id, suggestion.linkedSuggestions, this.isOverlay);
        } else {
          const dialogRef: MatDialogRef<SuggestionLinkingDialogComponent, SuggestionLinkingDialogComponentData[]> = this.dialog.open(SuggestionLinkingDialogComponent, {
            data: suggestion
          });
          dialogRef.afterClosed().subscribe(suggestions => {
            if (suggestions) {
              const linkedIDs = suggestions.filter(s => s.selected === true).map(s => s.id);
              this.suggestionLinkingService.linkSuggestions(suggestion.id, linkedIDs, this.isOverlay);
              this.provenanceService.log(new GuidanceInteractionEvent(suggestion, 'link'), this.userRole);
            }
          })
        }
    }
  }

  guidanceLink(ids: number[], interaction: InteractionTypes, role: UserRole, external = false) {
    // console.log(this.userRole, this.isOverlay, 'guidanceLink', interaction, role);
    if ((this.isOverlay && role === 'user') || (this.userRole === role) || this.userRole === 'wizard' && interaction === 'accept') {
      const linked = this.suggestions.filter(s => ids.includes(s.id));
      if (linked.length > 0) {
      }
      linked.forEach(s => this.processGuidance(s, interaction, role, true, true));
    }
  }

  private removeSuggestion(suggestion: DimpVisSuggestion<T>, partial: boolean = false): void {
    this.suggestionLinkingService.removeSuggestions(this.getComponent(), s => s.id === suggestion.id, this.isOverlay, partial);
  }
}
