import { ApiPromise, WsProvider } from "@polkadot/api";
import program from "commander";

import ApiHandler from "./handler";
import Db from "./db";
import Logger from "./Logger";

type StartOptions = {
  db: string;
  types: string;
  ws: string;
};

const createApi = (endpoint: string, types?: string): Promise<ApiPromise> => {
  if (typeof types === "string") types = JSON.parse(types);

  return ApiPromise.create({
    provider: new WsProvider(endpoint),
    types: types as any,
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
  while (
    currentHash !=
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ) {
    const block = await handler.fetchBlock(currentHash);
    Logger.info(`saving block ${block.number}`);
    db.save(JSON.parse(JSON.stringify(block)));

    currentHash = block.parentHash;
  }

  process.exit(0);
};

const start = async (opts: StartOptions) => {
  const { db, types, ws } = opts;
  Logger.info("Initializing API...");
  const api = await createApi(ws, types);
  const handler = new ApiHandler(api);
  const database = new Db(db);
  await roughScrape(api, handler, database);
};

program
  .command("start")
  .option("--db <file>", "The file to store the scraped data.", "scraped.db")
  .option(
    "--types <JSON>",
    "A JSON configuration of the types for the node.",
    ""
  )
  .option(
    "--ws <endpoint>",
    "The WebSockets endpoint of the node.",
    "ws://localhost:9944"
  )
  .action(start);

program.parse(process.argv);
