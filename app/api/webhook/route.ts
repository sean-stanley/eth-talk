


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

  return new Response(JSON.stringify(relevantActionItems), {
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(body);
  return new Response('OK');
}
