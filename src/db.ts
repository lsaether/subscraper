import Datastore from "nedb-promises";

class Db {
  private datastore: any;

  constructor(dbPath: string) {
    this.datastore = Datastore.create(dbPath as any);
  }

  findAll = (field: any): Promise<any> => {
    return this.datastore.find({
      [field]: /.*/,
    });
  };

  /// Gets the block with the lowest number that is saved in the
  /// datastore.
  ///
  /// NOTE: This makes no guarantee that all the blocks higher than
  /// this are already scraped.
  getLowestSavedBlock = (): Promise<any> => {
    return this.datastore
      .find({
        number: { $gte: 0 },
      })
      .sort({ number: 1 })
      .limit(1);
  };

  /// Gets the block with the highest number that is saved in the
  /// datastore.
  ///
  /// NOTE: This makes no guarentee that all the blocks lower than this
  /// are already scraped.
  getHighestSavedBlock = (): Promise<any> => {
    return this.datastore
      .find({
        number: { $gte: 0 },
      })
      .sort({ number: -1 })
      .limit(1);
  };

  hasBlock = async (number: number): Promise<boolean> => {
    const block = await this.datastore.find({
      number,
    });

    if (!block.length) {
      return false;
    } else return true;
  };

  findClaimed = async () => {
    const docs = await this.datastore.find({
      "extrinsics.method": "claims.claim",
    });
    return docs;
  };

  saveField = (field: string, value: any): Promise<any> => {
    return this.datastore.insert({
      [field]: value,
    });
  };

  save = (obj: any): Promise<any> => {
    return this.datastore.insert(obj);
  };
}

export default Db;
