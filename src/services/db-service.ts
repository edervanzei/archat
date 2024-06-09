import WeaveDB from "weavedb-sdk";

export enum CollectionName {
   Messages="messages"
}

export class DbService {
   private db: WeaveDB;

   private identity: any;
   private connected: boolean = false;

   public constructor() {
      this.db = new WeaveDB({ contractTxId: process.env.CONTRACT_TX_ID });
   }

   public async connect(): Promise<void> {
      await this.db.init();

      const tempUser: string = localStorage.getItem("userwallet");
      const identity: any = tempUser ? JSON.parse(localStorage.getItem("userwallet")) : (await this.db.createTempAddressWithAR()).identity;

      localStorage.setItem("userwallet", JSON.stringify(identity));
      localStorage.setItem("pubkey", identity.signer);
      this.identity = identity;

      this.connected = true;
   }

   public async get(collection: CollectionName, ts: Date, after: boolean, ifs?: any): Promise<any[]> {
      if (!this.connected)
         return;

      if (!ts)
         ts = new Date();

      return await this.db.cget(collection, 20, ["timestamp", "desc"], ["timestamp", after ? ">" : "<", ts], ifs);
   }

   public async add(data: any, collection: CollectionName): Promise<void> {
      if (!this.connected)
         return;

      data.timestamp = this.db.ts();
      await this.db.add(data, collection, this.identity);
   }

   public async delete(id: string, collection: CollectionName): Promise<void> {
      await this.db.delete(collection, id, this.identity);
   }
}