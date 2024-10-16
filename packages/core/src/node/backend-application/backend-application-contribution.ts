import { createServiceIdentifier } from '@gpk/core/common/instantiation';

export const _IBackendApplicationContribution = Symbol.for("IBackendApplicationContribution");
export const IBackendApplicationContribution = createServiceIdentifier<IBackendApplicationContribution>(_IBackendApplicationContribution, true);
export interface IBackendApplicationContribution {
  onInitialize?(): Promise<void>
}
