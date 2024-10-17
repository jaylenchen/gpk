import { FrontendApplication } from '@gpk/core/browser/frontend-application/frontend-application';
import { defineContainerModule } from '@gpk/core/common/instantiation';

export default defineContainerModule([
  {
    id: FrontendApplication,
    implementation: FrontendApplication
  }
])
