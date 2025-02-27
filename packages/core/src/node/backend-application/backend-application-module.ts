import { BackendApplication } from '@gpk/core/node/backend-application/backend-application';
import { defineContainerModule, ServiceImplementationType } from '@gpk/core/common/instantiation';

export default defineContainerModule([
  {
    type: ServiceImplementationType.Class,
    id: BackendApplication,
    implementation: BackendApplication
  }
])
