import { BackendApplication } from '@gpk/core/node/backend-application/backend-application';
import { createService, ContainerModule } from '@gpk/core/common/instantiation';

export default new ContainerModule((bind) => {
  bind(BackendApplication).to(createService(BackendApplication)).inSingletonScope();
})
