/** The seven resin codes we classify into. */
export const MATERIAL_CODES = [
  'PET 1',
  'HDPE 2',
  'PVC 3',
  'LDPE 4',
  'PP 5',
  'PS 6',
  'OTHER 7',
] as const;

/** One distinct item detected in a photo. */
export interface DetectedItem {
  is_recyclable: boolean;
  item_name: string;
  material_type: string;
  quantity: number;
  estimated_weight_grams: number;
  recycling_instructions: string;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
}

/** Raw multi-item shape returned by a provider. */
export interface ClassificationEnvelope {
  items: DetectedItem[];
  requires_manual_sorting: boolean;
}

/**
 * Flat single-item view kept for backwards compatibility with the Flutter
 * client, which parses these keys at the top level. Derived from `items`.
 */
export interface ClassificationResult {
  is_recyclable: boolean;
  item_name: string;
  material_type: string;
  quantity: number;
  estimated_weight_grams: number;
  recycling_instructions: string;
  confidence_score: number;
  items?: DetectedItem[];
  requires_manual_sorting?: boolean;
}

export interface AiProvider {
  readonly name: 'gemini' | 'ollama';
  isAvailable(): Promise<boolean>;
  classify(image: Buffer, mimetype: string): Promise<ClassificationResult>;
}

/**
 * Collapses a multi-item envelope into the flat legacy shape.
 *
 * The headline item is the highest-confidence one, but the overall
 * confidence_score is the MINIMUM across items: if any single item in the
 * photo is uncertain, the whole scan is uncertain. Showing a confident verdict
 * while one item was a guess is exactly the failure this app exists to avoid.
 */
export function flattenEnvelope(
  env: ClassificationEnvelope,
): ClassificationResult {
  const items = (env.items || []).filter(Boolean);

  if (items.length === 0) {
    return {
      is_recyclable: false,
      item_name: 'Unknown',
      material_type: 'OTHER 7',
      quantity: 0,
      estimated_weight_grams: 0,
      recycling_instructions:
        'Could not identify anything in this photo. Try a clearer picture in good light.',
      confidence_score: 0,
      items: [],
      requires_manual_sorting: true,
    };
  }

  const headline = items.reduce((a, b) =>
    (b.confidence_score ?? 0) > (a.confidence_score ?? 0) ? b : a,
  );
  const minScore = Math.min(...items.map((i) => i.confidence_score ?? 0));
  const distinctMaterials = new Set(items.map((i) => i.material_type)).size;
  const totalWeight = items.reduce(
    (sum, i) => sum + (Number(i.estimated_weight_grams) || 0),
    0,
  );
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const manual =
    env.requires_manual_sorting === true ||
    distinctMaterials > 1 ||
    minScore < 0.6;

  return {
    // Only call the whole photo recyclable when EVERY item is.
    is_recyclable: items.every((i) => i.is_recyclable === true),
    item_name:
      items.length === 1
        ? headline.item_name
        : `${items.length} items — ${headline.item_name} and ${items.length - 1} more`,
    material_type: headline.material_type,
    quantity: totalQty,
    estimated_weight_grams: totalWeight,
    recycling_instructions:
      items.length === 1
        ? headline.recycling_instructions
        : items
            .map((i) => `${i.material_type}: ${i.recycling_instructions}`)
            .join(' '),
    confidence_score: minScore,
    items,
    requires_manual_sorting: manual,
  };
}
