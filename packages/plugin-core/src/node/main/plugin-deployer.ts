import { IPluginDeployer, IPluginDeployerHandler } from '@gpk/plugin-core/common/plugin-deployer';

export class PluginDeployer implements IPluginDeployer {

  constructor(@IPluginDeployerHandler protected readonly pluginDeployerHandler: IPluginDeployerHandler) { }

  async start(): Promise<void> {
    await this.initResolver();
    await this.deployPlugins();
  }

  async initResolver(): Promise<void> {
    console.log("init resolver")
  }

  async deployPlugins(): Promise<void> {
    this.pluginDeployerHandler.deployPlugins();
  }
}
