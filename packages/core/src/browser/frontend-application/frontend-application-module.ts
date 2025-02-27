import { FrontendApplication } from '@gpk/core/browser/frontend-application/frontend-application';
import { defineContainerModule, ServiceImplementationType } from '@gpk/core/common/instantiation';

export default defineContainerModule([
  {
    type: ServiceImplementationType.Class,
    id: FrontendApplication,
    implementation: FrontendApplication
  }
])
