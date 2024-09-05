import { IFrontendApplicationContribution } from '@gpk/core/lib/browser/frontend-application/frontend-application-contribution-point';
import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';

export const _IConsoleContribution = Symbol.for("IConsoleContribution")
export const IConsoleContribution = createServiceIdentifier<IConsoleContribution>(_IConsoleContribution);
export interface IConsoleContribution extends IFrontendApplicationContribution { }

export class ConsoleContribution implements IConsoleContribution {
  onStart(): void {
    console.log('ConsoleContribution started');
  }
}
