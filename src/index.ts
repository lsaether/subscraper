import { ApiPromise, WsProvider } from "@polkadot/api";
import program from "commander";

import ApiHandler from "./handler";
import Db from "./db";
import Logger from "./Logger";

type StartOptions = {
  db: string;
  ws: string;
};

const createApi = (endpoint: string): Promise<ApiPromise> => {
  return ApiPromise.create({
    provider: new WsProvider(endpoint),
  });
};

const roughScrape = async (
  api: ApiPromise,
  handler: ApiHandler,
  db: Db
): Promise<void> => {
  const blockHash = await api.rpc.chain.getBlockHash();

  const recentBlock = await handler.fetchBlock(blockHash);

  let currentHash = recentBlock.hash;
  while (currentHash) {
    const block = await handler.fetchBlock(currentHash);
    db.save(JSON.parse(JSON.stringify(block)));

    currentHash = block.parentHash;
  }
};

const start = async (opts: StartOptions) => {
  const { db, ws } = opts;
  Logger.info("Initializing API...");
  const api = await createApi(ws);
  const handler = new ApiHandler(api);
  const database = new Db(db);
  await roughScrape(api, handler, database);
};

program
  .command("start")
  .option("--db <file>", "The file to store the scraped data.", "scraped.db")
  .option(
    "--ws <endpoint>",
    "The WebSockets endpoint of the node.",
    "ws://localhost:9944"
  )
  .action(start);

program.parse(process.argv);
