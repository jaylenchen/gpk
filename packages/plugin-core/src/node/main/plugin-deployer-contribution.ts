import { IBackendApplicationContribution } from "@gpk/core/lib/node/backend-application/backend-application-contribution"
import { IPluginDeployer } from '@gpk/plugin-core/common/plugin-deployer';
import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';


export const _IPluginDeployerContribution = Symbol.for("IPluginDeployerContribution")
export const IPluginDeployerContribution = createServiceIdentifier<IPluginDeployerContribution>(_IPluginDeployerContribution);
export interface IPluginDeployerContribution extends IBackendApplicationContribution { }

export class PluginDeployerContribution implements IBackendApplicationContribution {

  constructor(@IPluginDeployer protected pluginDeployer: IPluginDeployer) { }

  async onInitialize(): Promise<void> {
    this.pluginDeployer.start().catch(error => {
      return console.log("Initializing plugin deployer failed.", error)
    })

    return Promise.resolve()
  }
}
