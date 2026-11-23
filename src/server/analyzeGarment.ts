import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  normalizeSeason,
  normalizeStylingPayload,
  sanitizeTextHint,
  validateBase64Image,
  VALID_SILHOUETTES,
} from '../utils/stylistValidation.ts';
import type { StylingResult } from '../types/stylist';

const SILHOUETTE_LIST = Array.from(VALID_SILHOUETTES).join(', ');

export interface AnalyzeRouteResult {
  status: number;
  body: StylingResult | { error: string };
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : 0;
      if (attempt < maxAttempts && (status >= 500 || status === 0)) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

const stylingResponseSchema = {
  type: Type.OBJECT,
  properties: {
    item: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Specific editorial name of the uploaded garment' },
        category: {
          type: Type.STRING,
          description: 'One of: top, bottom, outerwear, dress, footwear, bag',
        },
        silhouette: { type: Type.STRING, description: 'Concise cut/silhouette description' },
        pattern: { type: Type.STRING, description: 'Print, weave, or solid surface detail' },
        fabric: { type: Type.STRING, description: 'Likely material/fabric weight' },
        formalityRange: { type: Type.STRING, description: 'e.g. Weekend Casual to Cocktail Evening' },
        styleSummary: {
          type: Type.STRING,
          description: '2-sentence fashion director assessment of the garment character',
        },
        stylingChallenge: {
          type: Type.STRING,
          description: '1 sentence explaining why this item can feel tricky to match',
        },
        palette: {
          type: Type.ARRAY,
          description: 'Exactly 5 extracted hex color swatches from the garment',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              hex: { type: Type.STRING, description: '6-digit hex color like #1B4332' },
              role: {
                type: Type.STRING,
                description:
                  'One of: Dominant, Secondary, Accent, Neutral Anchor, Bridge Tone',
              },
              proportion: { type: Type.INTEGER, description: 'Approximate percentage 5-70' },
            },
            required: ['name', 'hex', 'role', 'proportion'],
          },
        },
      },
      required: [
        'name',
        'category',
        'silhouette',
        'pattern',
        'fabric',
        'formalityRange',
        'styleSummary',
        'stylingChallenge',
        'palette',
      ],
    },
    outfits: {
      type: Type.ARRAY,
      description: 'Exactly 3 distinct complete outfits: casual, business, and night_out',
      items: {
        type: Type.OBJECT,
        properties: {
          occasion: {
            type: Type.STRING,
            description: 'Must be one of: casual, business, night_out',
          },
          title: { type: Type.STRING, description: 'Editorial look title (2-4 words)' },
          vibe: { type: Type.STRING, description: 'Short mood description' },
          colorHarmony: {
            type: Type.STRING,
            description: 'Color theory approach e.g. Tonal Grounding, Complementary Pop',
          },
          stylistNote: {
            type: Type.STRING,
            description: '2 crisp sentences explaining why this pairing elevates the uploaded item',
          },
          proportionTip: {
            type: Type.STRING,
            description: '1 practical styling tip (tucking, sleeve cuffing, hemline balance)',
          },
          paletteUsed: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          pieces: {
            type: Type.ARRAY,
            description:
              '4 to 5 complementary pieces (DO NOT include the uploaded item itself; include the opposite main garment if needed, optional outerwear layer, footwear, bag, and 1-2 accessories)',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  description:
                    'One of: top, bottom, outerwear, dress, footwear, bag, accessory, eyewear, belt',
                },
                silhouette: {
                  type: Type.STRING,
                  description: `Exact flat-lay template id from: ${SILHOUETTE_LIST}`,
                },
                colorName: { type: Type.STRING },
                colorHex: { type: Type.STRING, description: 'Primary 6-digit hex color' },
                secondaryColorHex: {
                  type: Type.STRING,
                  description: 'Secondary trim/hardware/sole 6-digit hex color',
                },
                material: { type: Type.STRING },
                fitNotes: { type: Type.STRING },
                stylingReason: {
                  type: Type.STRING,
                  description: 'Why this piece works specifically with the uploaded garment',
                },
              },
              required: [
                'name',
                'category',
                'silhouette',
                'colorName',
                'colorHex',
                'material',
                'fitNotes',
                'stylingReason',
              ],
            },
          },
        },
        required: [
          'occasion',
          'title',
          'vibe',
          'colorHarmony',
          'stylistNote',
          'proportionTip',
          'paletteUsed',
          'pieces',
        ],
      },
    },
  },
  required: ['item', 'outfits'],
};

export async function analyzeGarmentRequest(
  rawBody: Record<string, unknown>
): Promise<AnalyzeRouteResult> {
  try {
    const { imageBase64, mimeType, itemHint, season } = rawBody;

    const validation = validateBase64Image(imageBase64, mimeType);
    if (!validation.valid || !validation.cleanBase64) {
      return {
        status: 400,
        body: { error: validation.error ?? 'Invalid image upload.' },
      };
    }

    const cleanSeason = normalizeSeason(season);
    const cleanHint = sanitizeTextHint(itemHint, 160);

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch {
      return {
        status: 503,
        body: {
          error:
            'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in your deployment Environment Variables and redeploy.',
        },
      };
    }

    const modelName = (process.env.GEMINI_MODEL || 'gemini-4-hydrogen').trim();
    const supportsThinkingLevel = /^gemini-[34]/.test(modelName);

    const prompt = [
      'Analyze this uploaded clothing item photograph as a senior editorial fashion stylist.',
      '1. Identify the exact garment type, silhouette, pattern, fabric, and extract 5 accurate hex colors present in the garment (Dominant, Secondary, Accent, Neutral Anchor, Bridge Tone).',
      '2. Design exactly 3 distinct, wearable, fashion-forward complete outfits built around this uploaded item: "casual", "business", and "night_out".',
      '3. Each outfit must list 4 to 5 complementary pieces (never repeat the uploaded item itself in the pieces array). Include the complementary garment (e.g., if the uploaded item is a skirt or trousers, include a top and optionally outerwear; if it is a top or jacket, include bottoms), plus footwear, a bag, and 1-2 refined accessories (jewelry, sunglasses, scarf, or belt).',
      `4. Choose exact silhouette template names from this list so our studio flat-lay compositor renders accurate shapes: ${SILHOUETTE_LIST}.`,
      `5. Season target: ${cleanSeason}.`,
      cleanHint ? `6. User styling note: "${cleanHint}".` : '',
      'Keep copy concise, concrete, and editorial. Avoid generic buzzwords.',
    ]
      .filter(Boolean)
      .join('\n');

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType as string,
                data: validation.cleanBase64!,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          systemInstruction:
            'You are a minimalist luxury fashion director for Atelier Edit. Return strictly valid JSON adhering to the schema. Extract true hex colors directly visible in the garment photo.',
          responseMimeType: 'application/json',
          responseSchema: stylingResponseSchema,
          ...(supportsThinkingLevel
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      })
    );

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return {
        status: 502,
        body: {
          error:
            'The stylist model returned an empty analysis. Please try again with a clearer photo.',
        },
      };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return {
        status: 502,
        body: { error: 'Could not parse the styling analysis response. Please try again.' },
      };
    }

    const dataUrl = `data:${mimeType};base64,${validation.cleanBase64}`;
    const normalized = normalizeStylingPayload(parsed, dataUrl, cleanSeason);
    return { status: 200, body: normalized };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: number }).status)
        : 500;

    if (status === 403 || status === 401 || /PERMISSION_DENIED|API_KEY_INVALID/i.test(message)) {
      return {
        status: 403,
        body: {
          error:
            'Your GEMINI_API_KEY could not be authenticated. Verify the key in Environment Variables and redeploy.',
        },
      };
    }
    if (status === 404 || /NOT_FOUND/i.test(message)) {
      return {
        status: 404,
        body: {
          error:
            'The configured Gemini model was not found for this API key. Check your GEMINI_MODEL environment variable (e.g. gemini-2.5-flash on public keys).',
        },
      };
    }
    if (status === 429 || /RESOURCE_EXHAUSTED/i.test(message)) {
      return {
        status: 429,
        body: {
          error: 'Rate limit reached for the Gemini API. Please wait a moment and try again.',
        },
      };
    }
    if (status === 400 || /INVALID_ARGUMENT/i.test(message)) {
      return {
        status: 400,
        body: {
          error:
            'This image could not be processed by the vision model. Please try another JPEG or PNG photo.',
        },
      };
    }

    console.error('Stylist analyze error:', status, message);
    return {
      status: 502,
      body: { error: 'Unable to analyze this garment right now. Please try again in a moment.' },
    };
  }
}
