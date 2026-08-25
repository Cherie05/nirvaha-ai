import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nirvaha/models/scan_result.dart';
import 'package:nirvaha/screens/result_screen.dart';
import 'package:provider/provider.dart';
import 'package:nirvaha/providers/bin_provider.dart';
import 'package:nirvaha/services/api_service.dart';

void main() {
  group('ScanResult 0.60 Confidence Contract & Uncertainty Tests', () {
    test('confidenceScore 0.59 results in isUncertain == true', () {
      const result = ScanResult(
        isRecyclable: true,
        itemName: 'Plastic Cup',
        materialType: 'PET 1',
        quantity: 1,
        estimatedWeightGrams: 15,
        recyclingInstructions: 'Keep aside.',
        confidence: 'low',
        confidenceScore: 0.59,
      );

      expect(result.isUncertain, isTrue);
      expect(result.isHappyPath, isFalse);
    });

    test('confidenceScore 0.61 results in isUncertain == false (Happy Path)', () {
      const result = ScanResult(
        isRecyclable: true,
        itemName: 'PET Bottle',
        materialType: 'PET 1',
        quantity: 1,
        estimatedWeightGrams: 25,
        recyclingInstructions: 'Rinse and crush.',
        confidence: 'medium',
        confidenceScore: 0.61,
      );

      expect(result.isUncertain, isFalse);
      expect(result.isHappyPath, isTrue);
    });

    test('confidenceScore exactly 0.60 meets threshold and isUncertain == false', () {
      const result = ScanResult(
        isRecyclable: true,
        itemName: 'HDPE Container',
        materialType: 'HDPE 2',
        quantity: 1,
        estimatedWeightGrams: 50,
        recyclingInstructions: 'Rinse and sort.',
        confidence: 'medium',
        confidenceScore: 0.60,
      );

      expect(result.isUncertain, isFalse);
      expect(result.isHappyPath, isTrue);
    });

    test('isRecyclable false with high score 0.95 remains isUncertain == true', () {
      const result = ScanResult(
        isRecyclable: false,
        itemName: 'Multi-layer Foil Snack Bag',
        materialType: 'OTHER 7 / Foil',
        quantity: 1,
        estimatedWeightGrams: 8,
        recyclingInstructions: 'Cannot be recycled in standard facilities.',
        confidence: 'high',
        confidenceScore: 0.95,
      );

      expect(result.isUncertain, isTrue);
      expect(result.isHappyPath, isFalse);
    });

    test('ScanResult.fromJson with missing and null fields does not throw', () {
      final incompleteJson = <String, dynamic>{};
      final result = ScanResult.fromJson(incompleteJson);

      expect(result.isRecyclable, isFalse);
      expect(result.itemName, 'Unknown Item');
      expect(result.materialType, 'Unclassified Plastic');
      expect(result.quantity, 1);
      expect(result.estimatedWeightGrams, 0);
      expect(result.confidenceScore, 0.0);
      expect(result.isUncertain, isTrue);
    });

    test('confidence string "high" falls back to 0.90 if numeric score absent', () {
      final json = <String, dynamic>{
        'is_recyclable': true,
        'item_name': 'PET Bottle',
        'confidence': 'high',
      };
      final result = ScanResult.fromJson(json);

      expect(result.confidenceScore, 0.90);
      expect(result.isHappyPath, isTrue);
    });
  });

  group('ResultScreen UI Rendering Tests', () {
    testWidgets('Uncertainty path renders exact string and does NOT render weight or material', (tester) async {
      const uncertainResult = ScanResult(
        isRecyclable: false,
        itemName: 'Unknown Plastic Wrap',
        materialType: 'PVC 3',
        quantity: 2,
        estimatedWeightGrams: 80,
        recyclingInstructions: 'Keep this item aside until someone can check it.',
        confidence: 'low',
        confidenceScore: 0.42,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider(
            create: (_) => BinProvider(api: ApiService()),
            child: const ResultScreen(result: uncertainResult),
          ),
        ),
      );

      // Verify exact required warning string is displayed
      expect(
        find.text('Uncertain Material: Manual Sorting Required.'),
        findsOneWidget,
      );

      // Verify "Confidence 0.42" is displayed
      expect(
        find.text('Confidence 0.42'),
        findsOneWidget,
      );

      // Verify material ("PVC 3") and estimated weight ("80 g") are NOT rendered
      expect(find.text('PVC 3'), findsNothing);
      expect(find.text('80 g'), findsNothing);
      expect(find.text('Estimated Weight'), findsNothing);
      expect(find.text('Material Type'), findsNothing);

      // Verify the reason for withholding a verdict is present
      expect(find.text('Why am I seeing this?'), findsOneWidget);

      // The add-to-bin action must never be offered for an uncertain item.
      expect(find.text('Add to bin'), findsNothing);
    });

    testWidgets('Happy path renders item details, material, weight, and Add to Digital Bin', (tester) async {
      const happyResult = ScanResult(
        isRecyclable: true,
        itemName: 'PET Soda Bottle',
        materialType: 'PET 1',
        quantity: 1,
        estimatedWeightGrams: 25,
        recyclingInstructions: 'Rinse before recycling. Crush to save space.',
        confidence: 'high',
        confidenceScore: 0.92,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider(
            create: (_) => BinProvider(api: ApiService()),
            child: const ResultScreen(result: happyResult),
          ),
        ),
      );

      expect(find.text('Recyclable'), findsOneWidget);
      expect(find.text('Confidence 0.92'), findsOneWidget);
      expect(find.text('PET Soda Bottle'), findsOneWidget);
      expect(find.text('PET 1'), findsOneWidget);
      expect(find.text('25 g'), findsOneWidget);
      expect(find.text('Add to bin'), findsOneWidget);
    });
  });
}
