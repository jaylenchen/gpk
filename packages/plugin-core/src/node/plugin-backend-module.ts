import { defineContainerModule, IService } from '@gpk/core/lib/common/instantiation';
import { BACKEDN_APPLICATION_CONTRIBUTION } from "@gpk/core/lib/node/backend-application/backend-application-contribution"
import { PLUGIN_DEPLOYER } from '@gpk/plugin-core/common/plugin-deployer';
import { PLUGIN_DEPLOYER_CONTRIBUTION, PluginDeployerContribution } from '@gpk/plugin-core/node/main/plugin-deployer-contribution';
import { PluginDeployer } from '@gpk/plugin-core/node/main/plugin-deployer';
import { PluginDeployerHandler } from '@gpk/plugin-core/node/hosted/plugin-deployer-handler';
import { PLUGIN_DEPLOYER_HANDLER } from '@gpk/plugin-core/common/plugin-deployer';
import { PLUGIN_SUPPORT, PluginSupport } from '@gpk/plugin-core/node/hosted/plugin-support';
import { PLUGIN_SERVER } from '@gpk/plugin-core/common/plugin-server';
import { PluginServer } from '@gpk/plugin-core/node/hosted/plugin-server';
import { PLUGIN_PROCESS, PLUGIN_PROCESS_CONFIGURATIOIN } from '@gpk/plugin-core/common/plugin-process'
import { PluginProcess } from '@gpk/plugin-core/node/hosted/plugin-process'
import path from 'node:path';

const mainBackendServices: IService[] = [
  {
    id: PLUGIN_DEPLOYER,
    implementation: PluginDeployer
  },
  {
    id: PLUGIN_DEPLOYER_CONTRIBUTION,
    implementation: PluginDeployerContribution,
    tag: BACKEDN_APPLICATION_CONTRIBUTION
  },
];

const hostedBackendServices: IService[] = [
  {
    id: PLUGIN_DEPLOYER_HANDLER,
    implementation: PluginDeployerHandler
  },
  {
    id: PLUGIN_SUPPORT,
    implementation: PluginSupport,
    tag: BACKEDN_APPLICATION_CONTRIBUTION
  },
  {
    id: PLUGIN_SERVER,
    implementation: PluginServer
  },
  {
    id: PLUGIN_PROCESS,
    implementation: PluginProcess
  },
  {
    id: PLUGIN_PROCESS_CONFIGURATIOIN,
    constantValue: {
      path: path.join(__dirname, 'plugin-host'),
    }
  }
];

export default defineContainerModule([...mainBackendServices, ...hostedBackendServices])
