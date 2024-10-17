import { IBackendApplicationContribution } from "@gpk/core/lib/node/backend-application/backend-application-contribution"
import { IPluginDeployer } from '@gpk/plugin-core/common/plugin-deployer';
import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';


export const PLUGIN_DEPLOYER_CONTRIBUTION = Symbol.for("PluginDeployerContribution")
export const IPluginDeployerContribution = createServiceIdentifier<IPluginDeployerContribution>(PLUGIN_DEPLOYER_CONTRIBUTION);
export interface IPluginDeployerContribution extends IBackendApplicationContribution { }

export class PluginDeployerContribution implements IBackendApplicationContribution {

  constructor(@IPluginDeployer private readonly pluginDeployer: IPluginDeployer) { }

  async onInitialize(): Promise<void> {
    this.pluginDeployer.start().catch(error => {
      return console.log("Initializing plugin deployer failed.", error)
    })

    return Promise.resolve()
  }
}
