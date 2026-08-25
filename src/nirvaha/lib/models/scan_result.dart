/// Data model representing the JSON payload returned by the Nirvaha AI backend.
class ScanResult {
  /// Server-side id of this scan. Empty for locally-constructed results.
  ///
  /// The bin keys off this so the same photo cannot be added twice — once from
  /// the result screen, again from History.
  final String id;

  final bool isRecyclable;
  final String itemName;
  final String materialType;
  final int quantity;
  final num estimatedWeightGrams;
  final String recyclingInstructions;
  final String confidence;
  final double confidenceScore;
  final bool isMock;
  final String? imageUrl;

  /// On-device path of the photo just captured. Set client-side, never from
  /// JSON — it lets the result screen show the image with no network at all.
  final String? localImagePath;
  final DateTime? scannedAt;

  static const double confidenceThreshold = 0.60;

  const ScanResult({
    this.id = '',
    required this.isRecyclable,
    required this.itemName,
    required this.materialType,
    required this.quantity,
    required this.estimatedWeightGrams,
    required this.recyclingInstructions,
    required this.confidence,
    this.confidenceScore = 0.0,
    this.isMock = false,
    this.imageUrl,
    this.localImagePath,
    this.scannedAt,
  });

  /// Factory constructor to parse backend JSON safely without throwing on nulls/missing fields.
  factory ScanResult.fromJson(Map<String, dynamic> json) {
    final rawScore = json['confidence_score'];
    final rawConf = json['confidence'];

    double parsedScore = 0.0;
    if (rawScore is num) {
      parsedScore = rawScore.toDouble();
    } else if (rawScore is String) {
      parsedScore = double.tryParse(rawScore) ?? 0.0;
    } else if (rawConf is num) {
      parsedScore = rawConf.toDouble();
    } else if (rawConf is String) {
      final parsed = double.tryParse(rawConf);
      if (parsed != null) {
        parsedScore = parsed;
      } else {
        final lower = rawConf.trim().toLowerCase();
        if (lower == 'high') {
          parsedScore = 0.90;
        } else if (lower == 'medium') {
          parsedScore = 0.70;
        } else if (lower == 'low') {
          parsedScore = 0.35;
        }
      }
    }

    if (parsedScore > 1.0 && parsedScore <= 100.0) {
      parsedScore = parsedScore / 100.0;
    }
    parsedScore = parsedScore.clamp(0.0, 1.0);

    return ScanResult(
      id: (json['id'] ?? '').toString(),
      isRecyclable: json['is_recyclable'] as bool? ?? false,
      itemName: json['item_name'] as String? ?? 'Unknown Item',
      materialType: json['material_type'] as String? ?? 'Unclassified Plastic',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      estimatedWeightGrams: (json['estimated_weight_grams'] as num?) ?? 0,
      recyclingInstructions: json['recycling_instructions'] as String? ??
          'Keep this item aside until someone can check it.',
      confidence: json['confidence'] as String? ??
          (parsedScore >= 0.80
              ? 'high'
              : (parsedScore >= 0.60 ? 'medium' : 'low')),
      confidenceScore: parsedScore,
      isMock: json['is_mock'] as bool? ?? false,
      imageUrl: json['image_url'] as String?,
      scannedAt: json['scanned_at'] != null
          ? DateTime.tryParse(json['scanned_at'].toString())
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) 'id': id,
      'is_recyclable': isRecyclable,
      'item_name': itemName,
      'material_type': materialType,
      'quantity': quantity,
      'estimated_weight_grams': estimatedWeightGrams,
      'recycling_instructions': recyclingInstructions,
      'confidence': confidence,
      'confidence_score': confidenceScore,
      'is_mock': isMock,
      if (imageUrl != null) 'image_url': imageUrl,
      if (scannedAt != null) 'scanned_at': scannedAt!.toIso8601String(),
    };
  }

  /// Single source of truth for the verdict based on 0.60 threshold
  bool get isUncertain =>
      confidenceScore < confidenceThreshold || !isRecyclable;

  /// Happy path requires recyclable AND score >= 0.60
  bool get isHappyPath => !isUncertain;

  /// Formatted score display e.g. "Confidence 0.85"
  String get formattedConfidence =>
      'Confidence ${confidenceScore.toStringAsFixed(2)}';

  /// Formatted weight string in grams or kilograms
  String get formattedWeight {
    if (estimatedWeightGrams >= 1000) {
      return '${(estimatedWeightGrams / 1000).toStringAsFixed(2)} kg';
    }
    return '${estimatedWeightGrams.round()} g';
  }

  ScanResult copyWith({
    String? id,
    bool? isRecyclable,
    String? itemName,
    String? materialType,
    int? quantity,
    num? estimatedWeightGrams,
    String? recyclingInstructions,
    String? confidence,
    double? confidenceScore,
    bool? isMock,
    String? imageUrl,
    String? localImagePath,
    DateTime? scannedAt,
  }) {
    return ScanResult(
      id: id ?? this.id,
      isRecyclable: isRecyclable ?? this.isRecyclable,
      itemName: itemName ?? this.itemName,
      materialType: materialType ?? this.materialType,
      quantity: quantity ?? this.quantity,
      estimatedWeightGrams: estimatedWeightGrams ?? this.estimatedWeightGrams,
      recyclingInstructions:
          recyclingInstructions ?? this.recyclingInstructions,
      confidence: confidence ?? this.confidence,
      confidenceScore: confidenceScore ?? this.confidenceScore,
      isMock: isMock ?? this.isMock,
      imageUrl: imageUrl ?? this.imageUrl,
      localImagePath: localImagePath ?? this.localImagePath,
      scannedAt: scannedAt ?? this.scannedAt,
    );
  }

  /// Baseline scans with null URLs instead of remote Unsplash dependencies
  static List<ScanResult> get dummyScans => [
        ScanResult(
          isRecyclable: true,
          itemName: 'PET Water Bottle',
          materialType: 'PET 1',
          quantity: 1,
          estimatedWeightGrams: 25,
          recyclingInstructions:
              'Rinse with water. Remove cap and crush to save space.',
          confidence: 'high',
          confidenceScore: 0.92,
          imageUrl: null,
          scannedAt: DateTime.now().subtract(const Duration(hours: 2)),
        ),
        ScanResult(
          isRecyclable: true,
          itemName: 'HDPE Milk Jug',
          materialType: 'HDPE 2',
          quantity: 1,
          estimatedWeightGrams: 65,
          recyclingInstructions:
              'Wash thoroughly with water. Keep handle intact.',
          confidence: 'high',
          confidenceScore: 0.88,
          imageUrl: null,
          scannedAt: DateTime.now().subtract(const Duration(days: 1)),
        ),
        ScanResult(
          isRecyclable: false,
          itemName: 'Multi-layer Snack Wrapper',
          materialType: 'OTHER 7 / Metallized Film',
          quantity: 1,
          estimatedWeightGrams: 10,
          recyclingInstructions:
              'Composite plastic-foil packaging cannot be processed in standard municipal streams.',
          confidence: 'low',
          confidenceScore: 0.35,
          imageUrl: null,
          scannedAt: DateTime.now().subtract(const Duration(days: 2)),
        ),
      ];
}
