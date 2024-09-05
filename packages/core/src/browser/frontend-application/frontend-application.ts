import { IFrontendApplicationContribution } from '@gpk/core/browser/frontend-application/frontend-application-contribution-point';
import { createServiceIdentifier, optional } from '@gpk/core/common/instantiation';

export const _IFrontendApplication = Symbol.for('FrontendApplication');
export const IFrontendApplication = createServiceIdentifier<IFrontendApplication>(_IFrontendApplication);
export interface IFrontendApplication {
  start(): void
}

export class FrontendApplication implements IFrontendApplication {
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
