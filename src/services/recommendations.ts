import { MenuItem } from '../types';

export type DishRecommendation = {
  dishName: string;
  reason: string;
};

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string };

type AnthropicResponse = {
  content: ContentBlock[];
  stop_reason: string;
};

// In-memory cache keyed by restaurantId + stringified prefs
const cache = new Map<string, DishRecommendation[]>();

export async function getRecommendations(
  restaurantId: string,
  menuItems: MenuItem[],
  dietary: string[],
  cuisines: string[],
): Promise<DishRecommendation[]> {
  if (dietary.length === 0 && cuisines.length === 0) return [];

  const cacheKey = `${restaurantId}:${JSON.stringify(dietary)}:${JSON.stringify(cuisines)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set in .env');

  const prefsLines = [
    dietary.length > 0 ? `Dietary restrictions: ${dietary.join(', ')}` : null,
    cuisines.length > 0 ? `Preferred cuisines: ${cuisines.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const menuLines = menuItems
    .map((item) => `- ${item.name}: ${item.description}`)
    .join('\n');

  const prompt = `You are a food recommendation assistant helping a diner choose dishes that suit their preferences.

User preferences:
${prefsLines}

Menu highlights at this restaurant:
${menuLines}

Recommend 1–3 dishes that best match the user's preferences. Return ONLY a valid JSON array with no markdown or extra text. Each element: {"dishName": "<exact name from menu>", "reason": "<one short sentence>"}. If nothing matches, return [].`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${err}`);
  }

  const data = (await response.json()) as AnthropicResponse;

  const text = data.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Strip optional markdown code fences the model may include
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const result = JSON.parse(json) as DishRecommendation[];

  cache.set(cacheKey, result);
  return result;
}
