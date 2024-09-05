import { _IFrontendApplicationContribution } from '@gpk/core/lib/browser/frontend-application/frontend-application-contribution-point';
import { createService, ContainerModule } from '@gpk/core/lib/common/instantiation';
import { ConsoleContribution, _IConsoleContribution } from '@gpk/console/browser/console-contribution';


export default new ContainerModule((bind) => {
  bind(_IConsoleContribution).to(createService(ConsoleContribution)).inSingletonScope();
  bind(_IFrontendApplicationContribution).toService(_IConsoleContribution);
})
