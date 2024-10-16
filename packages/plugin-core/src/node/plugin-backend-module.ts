import { createService, ContainerModule } from '@gpk/core/lib/common/instantiation';
import { _IBackendApplicationContribution } from "@gpk/core/lib/node/backend-application/backend-application-contribution"
import { _IPluginDeployer } from '@gpk/plugin-core/common/plugin-deployer';
import { _IPluginDeployerContribution, PluginDeployerContribution } from '@gpk/plugin-core/node/main/plugin-deployer-contribution';
import { PluginDeployer } from '@gpk/plugin-core/node/main/plugin-deployer';
import { PluginDeployerHandler } from '@gpk/plugin-core/node/hosted/plugin-deployer-handler';
import { _IPluginDeployerHandler } from '@gpk/plugin-core/common/plugin-deployer';


export default new ContainerModule((bind) => {
  // ===================bind main backend service====================
  bind(_IPluginDeployer).to(createService(PluginDeployer)).inSingletonScope();
  bind(_IPluginDeployerContribution).to(createService(PluginDeployerContribution)).inSingletonScope();

  // ===================bind hosted backend service====================
  bind(_IPluginDeployerHandler).to(createService(PluginDeployerHandler)).inSingletonScope();

  // ====================bind main backend service alias====================
  bind(_IBackendApplicationContribution).toService(_IPluginDeployerContribution);
})
