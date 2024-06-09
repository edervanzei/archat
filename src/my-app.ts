import { ChatService, IChatMessage } from "./services/chat-service";
import { DbService } from "./services/db-service";

export class MyApp {
 
  private dbService: DbService;
  private chatService: ChatService;

  private loggedUser: string;
  private username: string;

  private messages: IChatMessage[] = [];
  private firstMessageLoaded: IChatMessage;
  private lastMessageLoaded: IChatMessage;
  private inputMessage: string = "";

  private channels: string[] = [];
  private currentChannel: string = "general";
  private canLoadMoreMessages: boolean = true;

  public constructor() {
    this.dbService = new DbService();
    this.chatService = new ChatService(this.dbService);

    this.loggedUser = localStorage.getItem("pubkey");
    this.username = localStorage.getItem("username");
    this.channels.push(this.currentChannel);
  }

  public async attached(): Promise<void> {
    await this.dbService.connect();
    await this.getMessages(false);
  }

  private async getMessages(after: boolean): Promise<void> {
    let ts: Date = (after ? this.lastMessageLoaded : this.firstMessageLoaded)?.timestamp;
    let result: IChatMessage[] = (await this.chatService.getMessages(this.currentChannel, ts, after)).reverse();

    if (result.length === 0) {
      this.canLoadMoreMessages = false;
      return;
    }

    if (after)
      this.messages.push(...result);
    else {
      result.push(...this.messages);
      this.messages = result;
    }

    this.firstMessageLoaded = this.messages[0];
    this.lastMessageLoaded = this.messages[this.messages.length - 1];
  }

  private async sendMessage(e: KeyboardEvent): Promise<void> {
    if (e.key !== "Enter")
      return;

    await this.chatService.sendMessage(this.currentChannel, this.inputMessage, this.username);
    await this.getMessages(true);

    this.inputMessage = "";
  }

  private setProfile(): void {
    let username: string = prompt("Set your username");
    if (!username)
      return;

    this.username = username;
    localStorage.setItem("username", username);
  }

  private async joinChannel(channel?: string): Promise<void> {
    if (this.currentChannel === channel)
      return;

    if (!channel)
      channel = prompt("Channel to join");

    this.currentChannel = channel;
    if (!this.channels.includes(channel))
      this.channels.push(channel);

    this.canLoadMoreMessages = true;
    this.lastMessageLoaded = null;
    this.firstMessageLoaded = null;

    this.messages = [];
    await this.getMessages(false);
  }

  private async deleteMessage(id: string, index: number): Promise<void> {
    if (!confirm("Delete this message?"))
      return;

    await this.chatService.deleteMessage(id);
    this.messages.splice(index, 1);
  }
}
