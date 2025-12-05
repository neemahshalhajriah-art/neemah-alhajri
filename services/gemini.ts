import { GoogleGenAI, Content, Part } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION } from "../constants";
import { Message, Attachment, Role } from "../types";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

export const streamChatResponse = async (
  history: Message[],
  newMessage: string,
  attachments: Attachment[],
  onChunk: (text: string) => void
): Promise<string> => {
  const genAI = getClient();

  // Convert history to Gemini Content format
  // We filter out the last message because we will send it explicitly
  const previousHistory: Content[] = history.map((msg) => {
    const parts: Part[] = [{ text: msg.content }];
    
    // Add attachments from history if they exist (simplification: usually we rely on chat session history, 
    // but here we reconstruct manually to ensure context is preserved statelessly if needed, 
    // though using chat.sendMessageStream handles context automatically. 
    // We will use the chat session approach below).
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        if (att.type === 'image') {
             parts.push({
                inlineData: {
                    mimeType: att.mimeType,
                    data: att.data
                }
             });
        } else {
            // Treat text files as text context
            parts.push({
                text: `\n[File Content: ${att.name}]\n${att.data}\n`
            });
        }
      });
    }

    return {
      role: msg.role,
      parts: parts,
    };
  });

  const chatSession = genAI.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4, // Lower temperature for more precise administrative answers
    },
    history: previousHistory
  });

  // Prepare current message parts
  const currentParts: Part[] = [{ text: newMessage }];
  
  // Add current attachments
  if (attachments.length > 0) {
    attachments.forEach(att => {
        if (att.type === 'image') {
             currentParts.push({
                inlineData: {
                    mimeType: att.mimeType,
                    data: att.data
                }
             });
        } else {
             // For text/CSV files, append content as text
             currentParts.push({
                text: `\n[CONTEXT FILE: ${att.name}]\n${att.data}\n`
             });
        }
    });
  }

  // Use sendMessageStream
  // Note: The SDK expects a string message or specific structure. 
  // For multi-part (text + image), we use the parts array directly in `sendMessageStream`?
  // The SDK signature for sendMessageStream accepts `string | Part[]`.
  // Wait, checking documentation... `sendMessageStream({ message: ... })`.
  // The `message` property can be string or array of parts.
  
  // Correct usage based on SDK guidelines:
  // chat.sendMessageStream({ message: ... })
  
  // However, constructing the payload:
  // If we have parts, we pass the parts.
  
  const result = await chatSession.sendMessageStream({
      message: currentParts.length === 1 && !currentParts[0].inlineData ? currentParts[0].text! : currentParts
  });

  let fullResponse = "";
  for await (const chunk of result) {
    const text = chunk.text;
    if (text) {
      fullResponse += text;
      onChunk(text);
    }
  }

  return fullResponse;
};
