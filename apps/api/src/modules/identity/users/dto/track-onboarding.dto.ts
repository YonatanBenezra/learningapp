import { IsIn } from 'class-validator';
import { ONBOARDING_EVENTS, type OnboardingEventName } from '../onboarding';

export class TrackOnboardingDto {
  @IsIn(ONBOARDING_EVENTS)
  name!: OnboardingEventName;
}
