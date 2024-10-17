import { IPluginProcess, IPluginProcessConfiguration } from '@gpk/plugin-core/common/plugin-process';
import * as cp from 'child_process';

export class PluginProcess implements IPluginProcess {

  private childProcess: cp.ChildProcess | undefined;

  constructor(@IPluginProcessConfiguration private readonly pluginProcessConfiguration: IPluginProcessConfiguration) { }

  runPluginServer(serverName?: string): void {
    this.childProcess = this.fork({ serverName });
    console.log("🚀 ~ PluginProcess ~ runPluginServer:", this.childProcess)
  }

  private fork(options: { serverName: string }): cp.ChildProcess {
    const forkOptions: cp.ForkOptions = {
      silent: true,
      execArgv: [],
      stdio: ['pipe', 'pipe', 'pipe', 'ipc', 'overlapped' as 'pipe']
    };
    const childProcess = cp.fork(this.pluginProcessConfiguration.path, forkOptions);

    childProcess.stdout!.on('data', data => console.info(`[${options.serverName}: ${childProcess.pid}] ${data.toString().trim()}`));
    childProcess.stderr!.on('data', data => console.error(`[${options.serverName}: ${childProcess.pid}] ${data.toString().trim()}`));
    childProcess.once('exit', (code: number, signal: string) => this.onChildProcessExit(options.serverName, childProcess.pid!, code, signal));
    childProcess.on('error', err => this.onChildProcessError(err));

    return childProcess;
  }

  private onChildProcessExit(serverName: string, pid: number, code: number, signal: string): void {
    console.error(`[${serverName}: ${pid}] IPC exited, with signal: ${signal}, and exit code: ${code}`);
  }

  private onChildProcessError(err: Error): void {
    console.error(`Error from plugin host: ${err.message}`);
  }
}
