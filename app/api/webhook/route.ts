import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

import { generateUUID } from '@/lib/utils';

export async function POST(request: Request) {
  const body = await request.json();
  const userId = new URL(request.url).searchParams.get('uid');
  console.log(userId, body);

  // Check the actionItems field for relevant keywords
  const transcriptSegments = body.transcript_segments
    .map((s: any) => s.text)
    .join('\n');

  console.log('transcribed text for the memory:', transcriptSegments);

  const textResponse = await generateText({
    model: openai.languageModel('gpt-4o-mini'),
    system:
      'determine if the conversation is asking for AI assistance to interact with their smart wallet. Return a sanitised command wrapped with "hey smart wallet" and "thanks smart wallet" triggers. Requests can be to transfer, swap, check balance, check their network, check wallet updates, check prices, get an ens, etc. When the text is not a command, return nothing.',
    prompt: transcriptSegments,
  });

  if (textResponse.text) {
    const streamedResponse = await fetch(
      'https://nextjs-ai-chatbot-ebon-iota.vercel.app/api/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: generateUUID(),
          messages: [{ role: 'user', content: textResponse.text }],
          modelId: 'gpt-4o',
        }),
      }
    );

    if (streamedResponse.body) {
      // stream response back to Omi app.
      return streamedResponse
    }
  }

  return new Response(
    JSON.stringify({
      role: 'agent',
      content: 'No crypto commands to respond to',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
