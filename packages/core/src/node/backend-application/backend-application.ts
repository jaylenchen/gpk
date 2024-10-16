import { optional } from '@gpk/core/common/instantiation';
import { IBackendApplicationContribution } from "@gpk/core/node/backend-application/backend-application-contribution"

export class BackendApplication {

  constructor(
    @optional() @IBackendApplicationContribution private readonly contributions: IBackendApplicationContribution[],
  ) { }

  async start(): Promise<void> {
    this.initializeContributions()
  }

  async initializeContributions(): Promise<void> {
    for (const contribution of this.contributions) {
      if (contribution.onInitialize) {
        contribution.onInitialize();
      }
    }
  }
}
