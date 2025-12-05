export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'text' | 'pdf'; // Simplified for this demo
  mimeType: string;
  data: string; // Base64 or text content
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}