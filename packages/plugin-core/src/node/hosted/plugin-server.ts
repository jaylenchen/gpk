// 对应theia/packages/plugin-ext/src/hosted/node/plugin-service.ts

import { IPluginDeployerHandler } from '@gpk/plugin-core/common/plugin-deployer';
import { IPluginProcess } from '@gpk/plugin-core/common/plugin-process';
import { IPluginServer } from '@gpk/plugin-core/common/plugin-server';

export class PluginServer implements IPluginServer {

  private isPluginProcessRunning = false;

  constructor(
    @IPluginDeployerHandler private readonly pluginDeployerHandler: IPluginDeployerHandler,
    @IPluginProcess private readonly pluginProcess: IPluginProcess
  ) { }

  async getDeployedPluginIds(): Promise<string[]> {
    const plugins = await this.pluginDeployerHandler.getDeployedPlugins();

    if (plugins > 0) {
      this.runPluginServer("server name");
    }

    const pluginIds = this.pluginDeployerHandler.getDeployedPluginIds()

    return pluginIds
  }

  async getUninstalledPluginIds(): Promise<string[]> {
    return ["plugin3", "plugin4"]
  }

  async getDeployedPlugins(pluginIds: string[]): Promise<string[]> {
    return ["plugin1", "plugin2", "plugin3", "plugin4"]
  }

  runPluginServer(serverName?: string): void {
    if (!this.isPluginProcessRunning) {
      this.pluginProcess.runPluginServer(serverName);
      this.isPluginProcessRunning = true;
    }
  }

}
