const START_TRIGGER_PHRASE = [
  'hey smart wallet',
  'hey, mart wallet',
  'hey matts wallet,',
  'hey smot wallet',
];

const STOP_TRIGGER_PHRASE = [
  'thanks smart wallet',
  'thanks smot wallet',
  'thanks mart wallet',
  'thanks matts wallet',
];

export async function POST(request: Request) {
  const body = await request.json();

  // Keywords
  const cryptoKeywords = [
    'crypto',
    'blockchain',
    'Bitcoin',
    'Ethereum',
    'wallet',
    'swap',
    'transaction',
    'portfolio',
  ];

  // Check the actionItems field for relevant keywords
  const relevantActionItems = body.structured.actionItems.filter(
    (action: string) =>
      cryptoKeywords.some((keyword) =>
        action.toLowerCase().includes(keyword.toLowerCase())
      )
  );

  console.log('Relevant Crypto Action Items:', relevantActionItems);

  let streamedResponse = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: body.id,
      messages: body.messages,
      modelId: body.modelId,
    }),
  });

  const result = await streamedResponse.json();
  console.log(result);

  return new Response(JSON.stringify(streamedResponse), {
    headers: { 'Content-Type': 'application/json' },
  });
}
