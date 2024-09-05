import { FrontendApplication } from '@gpk/core/browser/frontend-application/frontend-application';
import { createService, ContainerModule } from '@gpk/core/common/instantiation';

export default new ContainerModule((bind) => {
  bind(FrontendApplication).to(createService(FrontendApplication)).inSingletonScope();
})
