import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';

export const PLUGIN_DEPLOYER = Symbol.for("PluginDeployer")
export const IPluginDeployer = createServiceIdentifier<IPluginDeployer>(PLUGIN_DEPLOYER);
export interface IPluginDeployer {
  start(): Promise<void>;
}


export const PLUGIN_DEPLOYER_HANDLER = Symbol('PluginDeployerHandler');
export const IPluginDeployerHandler = createServiceIdentifier<IPluginDeployer>(PLUGIN_DEPLOYER_HANDLER);
export interface IPluginDeployerHandler {
  deployPlugins(): Promise<number>;

  getDeployedPlugins(): Promise<number>;

  getDeployedPluginIds(): Promise<string[]>
}
