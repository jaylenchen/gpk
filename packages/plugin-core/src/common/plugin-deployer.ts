import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';

export const _IPluginDeployer = Symbol.for("IPluginDeployer")
export const IPluginDeployer = createServiceIdentifier<IPluginDeployer>(_IPluginDeployer);
export interface IPluginDeployer {
  start(): Promise<void>;
}


export const _IPluginDeployerHandler = Symbol('IPluginDeployerHandler');
export const IPluginDeployerHandler = createServiceIdentifier<IPluginDeployer>(_IPluginDeployerHandler);
export interface IPluginDeployerHandler {
  deployPlugins(): Promise<number>
}
