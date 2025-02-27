import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';
import { IBackendApplicationContribution } from "@gpk/core/lib/node/backend-application/backend-application-contribution"
import { IPluginServer } from '@gpk/plugin-core/common/plugin-server';


export const PLUGIN_SERVICE = Symbol.for("PluginService")
export const IPluginSupport = createServiceIdentifier<IPluginService>(PLUGIN_SERVICE);
export interface IPluginService {
  syncPlugins(): Promise<void>;

  startPlugins(): Promise<void>
}

export class PluginService implements IPluginService, IBackendApplicationContribution {

  constructor(@IPluginServer private readonly pluginServer: IPluginServer) { }

  async onStart(): Promise<void> {
    await this.syncPlugins();
    await this.startPlugins()
  }

  async syncPlugins(): Promise<void> {
    const [deployedPluginIds, uninstalledPluginIds] = await Promise.all([this.pluginServer.getDeployedPluginIds(), this.pluginServer.getUninstalledPluginIds()]);
    console.log("🚀 ~ PluginSupport ~ syncPlugins ~ deployedPluginIds, uninstalledPluginIds:", deployedPluginIds, uninstalledPluginIds)
  }

  async startPlugins(): Promise<void> {
    console.log("🚀 ~ PluginSupport ~ startPlugins ~ startPlugins:")
  }
}
