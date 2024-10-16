import 'reflect-metadata'

async function startBackendApplication() {

  const { Container } = await import("@gpk/core/lib/common/instantiation");
  const container = new Container();

  const backendApplicationModule = (await import("@gpk/core/lib/node/backend-application/backend-application-module")).default;
  const { BackendApplication } = await import('@gpk/core/lib/node/backend-application/backend-application');

  container.load(backendApplicationModule);

  const pluginBackendModule = (await import("@gpk/plugin-core/lib/node/plugin-backend-module")).default;

  container.load(pluginBackendModule);

  const backendApplication = container.get(BackendApplication);

  backendApplication.start()
}

startBackendApplication()
