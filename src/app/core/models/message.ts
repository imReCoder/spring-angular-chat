export interface MessageDTO {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  messageId?:string
  messageClientId:string
  status:MessageStatus
}

export enum MessageStatus {
  QUEUED = 'QUEUED' ,
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

export interface MessageUpdateDTO {
  messageId: string;
  status: MessageStatus;
  messageClientId?:string
}
