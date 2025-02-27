import { defineContainerModule, IService, ServiceImplementationType } from '@gpk/core/lib/common/instantiation';
import { BACKEDN_APPLICATION_CONTRIBUTION } from "@gpk/core/lib/node/backend-application/backend-application-contribution"
import { PLUGIN_DEPLOYER } from '@gpk/plugin-core/common/plugin-deployer';
import { PLUGIN_DEPLOYER_CONTRIBUTION, PluginDeployerContribution } from '@gpk/plugin-core/node/main/plugin-deployer-contribution';
import { PluginDeployer } from '@gpk/plugin-core/node/main/plugin-deployer';
import { PluginDeployerHandler } from '@gpk/plugin-core/node/hosted/plugin-deployer-handler';
import { PLUGIN_DEPLOYER_HANDLER } from '@gpk/plugin-core/common/plugin-deployer';
import { PLUGIN_SERVICE, PluginService } from '@gpk/plugin-core/node/hosted/plugin-service';
import { PLUGIN_SERVER } from '@gpk/plugin-core/common/plugin-server';
import { PluginServer } from '@gpk/plugin-core/node/hosted/plugin-server';
import { PLUGIN_PROCESS_MANAGER, PLUGIN_PROCESS_CONFIGURATIOIN } from '@gpk/plugin-core/common/plugin-process'
import { PluginProcess } from '@gpk/plugin-core/node/hosted/plugin-process'

import path from 'node:path';
import { fileURLToPath } from 'url';


const mainBackendServices: IService[] = [
  {
    type: ServiceImplementationType.Class,
    id: PLUGIN_DEPLOYER,
    implementation: PluginDeployer
  },
  {
    type: ServiceImplementationType.Class,
    id: PLUGIN_DEPLOYER_CONTRIBUTION,
    implementation: PluginDeployerContribution,
    tag: BACKEDN_APPLICATION_CONTRIBUTION
  },
];

const hostedBackendServices: IService[] = [
  {
    type: ServiceImplementationType.Class,
    id: PLUGIN_DEPLOYER_HANDLER,
    implementation: PluginDeployerHandler
  },
  {
    type: ServiceImplementationType.Class,
    id: PLUGIN_SERVICE,
    implementation: PluginService,
    tag: BACKEDN_APPLICATION_CONTRIBUTION
  },
  {
    type: ServiceImplementationType.Class,
    id: PLUGIN_SERVER,
    implementation: PluginServer
  },
  {
    type: ServiceImplementationType.Class,
    id: PLUGIN_PROCESS_MANAGER,
    implementation: PluginProcess
  },
  {
    type: ServiceImplementationType.ConstantValue,
    id: PLUGIN_PROCESS_CONFIGURATIOIN,
    implementation: {
      puginHostMain: path.join(path.dirname(fileURLToPath(import.meta.url)), 'plugin-host-entry'),
    }
  }
];

export default defineContainerModule([...mainBackendServices, ...hostedBackendServices])
