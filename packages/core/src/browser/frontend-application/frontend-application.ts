import { IFrontendApplicationContribution } from '@gpk/core/browser/frontend-application/frontend-application-contribution-point';
import { optional } from '@gpk/core/common/instantiation';

export class FrontendApplication {
  constructor(
    @optional() @IFrontendApplicationContribution private readonly contributions: IFrontendApplicationContribution[],
  ) { }

  start() {
    console.log("start frontend application", this.contributions)
    this.startContributions();
  }

  startContributions() {
    for (const contribution of this.contributions) {
      if (contribution.onStart) {
        contribution.onStart();
      }
    }
  }
}
