// 对应theia工程的packages/plugin-ext/src/hosted/node/hosted-plugin-deployer-handler.ts

import { IPluginDeployerHandler } from '@gpk/plugin-core/common/plugin-deployer';

export class PluginDeployerHandler implements IPluginDeployerHandler {

  async deployPlugins(): Promise<number> {
    console.log("🚀 ~ HostedPluginDeployerHandler ~ deployPlugins ~ deployPlugins:")
    return 1;
  }

  protected async deployPlugin(): Promise<boolean> {
    return true;
  }

  async getDeployedPlugins(): Promise<number> {
    console.log("🚀 ~ PluginDeployerHandler ~ getDeployedPlugins ~ getDeployedPlugins");

    return 10
  }

  async getDeployedPluginIds(): Promise<string[]> {
    return ["plugin1", "plugin2"]
  }
}
