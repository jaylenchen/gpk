import { BackendApplication } from '@gpk/core/node/backend-application/backend-application';
import { defineContainerModule } from '@gpk/core/common/instantiation';

export default defineContainerModule([
  {
    id: BackendApplication,
    implementation: BackendApplication
  }
])
