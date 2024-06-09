import { CollectionName, DbService } from "./db-service";

export interface IChatMessage {
   id?: string;
   content: string;
   timestamp: Date;
   pubkey: string;
   username?: string;
}

export class ChatService {
   private db: DbService;

   public constructor(db: DbService) {
      this.db = db;
   }

   public async getMessages(channel: string, ts: Date, after: boolean): Promise<IChatMessage[]> {
      const result: IChatMessage[] = [];

      (await this.db.get(CollectionName.Messages, ts, after, ["channel", "==", channel])).forEach(el => {
         result.push({
            id: el.id,
            content: el.data.content,
            timestamp: el.data.timestamp,
            pubkey: el.data.pubkey,
            username: el.data.username
         });
      });

      return result;
   }

   public async sendMessage(channel: string, message: string, username: string): Promise<void> {
      await this.db.add({ channel: channel, content: message, username: username }, CollectionName.Messages);
   }

   public async deleteMessage(id: string): Promise<void> {
      await this.db.delete(id, CollectionName.Messages);
   }
}