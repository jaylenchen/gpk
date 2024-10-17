import { createServiceIdentifier } from '@gpk/core/common/instantiation';

export const BACKEDN_APPLICATION_CONTRIBUTION = Symbol.for("BackendApplicationContribution");
export const IBackendApplicationContribution = createServiceIdentifier<IBackendApplicationContribution>(BACKEDN_APPLICATION_CONTRIBUTION, true);
export interface IBackendApplicationContribution {
  onInitialize?(): Promise<void>
  onStart?(): Promise<void>
}
