import { User } from "./user";

export interface ChatListItem extends User {
  lastMessage: string;
  lastMessageTimestamp: number;
  unread: number;
}
