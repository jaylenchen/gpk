import { optional, postConstruct } from '@gpk/core/common/instantiation';
import { IBackendApplicationContribution } from "@gpk/core/node/backend-application/backend-application-contribution"
import * as http from "http"
import express from 'express';
export class BackendApplication {

  protected readonly app: express.Application = express();

  constructor(
    @optional() @IBackendApplicationContribution private readonly contributions: IBackendApplicationContribution[],
  ) { }

  @postConstruct()
  initialize(): void {
    this.initializeContributions();
  }

  async start(): Promise<void> {
    const server: http.Server = http.createServer(this.app);

    server.on('error', error => {
      /* The backend might run in a separate process,
       * so we defer `process.exit` to let time for logging in the parent process */
      setTimeout(process.exit, 0, 1);
    });

    server.listen(4000, "127.0.0.1", () => {
      const address = server.address()!;

      if (typeof address !== "string") {
        console.info(`Theia app listening on ${address.port}.`);
      } else {
        console.info(`Theia app listening on ${address}.`);
      }

    })

    /* Allow any number of websocket servers.  */
    server.setMaxListeners(0);

    await this.startContributions(server);
  }

  async initializeContributions(): Promise<void> {
    for (const contribution of this.contributions) {
      if (contribution.onInitialize) {
        contribution.onInitialize();
      }
    }
  }

  async startContributions(server: http.Server): Promise<void> {
    for (const contribution of this.contributions) {
      if (contribution.onStart) {
        contribution.onStart(server);
      }
    }
  }
}
