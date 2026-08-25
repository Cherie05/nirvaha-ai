import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../models/scan_result.dart';
import '../providers/scan_provider.dart';
import '../services/api_service.dart';

class BatchItemRecord {
  final XFile file;
  ScanResult? result;
  String? error;
  bool isProcessing;

  BatchItemRecord({
    required this.file,
    this.result,
    this.error,
    this.isProcessing = false,
  });
}

class BatchTestScreen extends StatefulWidget {
  const BatchTestScreen({super.key});

  @override
  State<BatchTestScreen> createState() => _BatchTestScreenState();
}

class _BatchTestScreenState extends State<BatchTestScreen> {
  final ImagePicker _picker = ImagePicker();
  final List<BatchItemRecord> _records = [];
  bool _isRunning = false;
  int _currentIndex = 0;

  Future<void> _pickBatchImages() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (images.isNotEmpty) {
        setState(() {
          _records.addAll(images.map((img) => BatchItemRecord(file: img)));
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking batch images: $e')),
        );
      }
    }
  }

  Future<void> _runBatchEvaluation() async {
    if (_records.isEmpty || _isRunning) return;

    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    final apiService = ApiService(baseUrl: scanProvider.backendUrl);

    setState(() {
      _isRunning = true;
      _currentIndex = 0;
    });

    for (int i = 0; i < _records.length; i++) {
      if (!mounted) break;
      final record = _records[i];

      // Skip already processed items
      if (record.result != null || record.error != null) continue;

      setState(() {
        _currentIndex = i + 1;
        record.isProcessing = true;
      });

      try {
        final result = await apiService.scanImage(record.file);
        record.result = result;
        record.error = null;
        // Optionally save to global history for tracking
        scanProvider.addResult(result);
      } catch (e) {
        record.error = e.toString();
        record.result = null;
      } finally {
        record.isProcessing = false;
        if (mounted) setState(() {});
      }
    }

    if (mounted) {
      setState(() {
        _isRunning = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Batch classification complete!'),
          backgroundColor: Color(0xFF059669),
        ),
      );
    }
  }

  void _copySummaryToClipboard() {
    final total = _records.length;
    final processed = _records.where((r) => r.result != null).toList();
    final recyclable = processed.where((r) => r.result!.isHappyPath).length;
    final uncertain = processed.where((r) => r.result!.isUncertain).length;
    final belowThreshold =
        processed.where((r) => r.result!.confidenceScore < 0.60).length;
    final failures = _records.where((r) => r.error != null).length;

    final meanConfidence = processed.isEmpty
        ? 0.0
        : (processed.fold<double>(
                0.0, (sum, r) => sum + r.result!.confidenceScore) /
            processed.length);

    final buffer = StringBuffer()
      ..writeln('=== NIRVAHA BATCH EVALUATION REPORT ===')
      ..writeln('Total Images Evaluated: $total')
      ..writeln('Successful Classifications: ${processed.length}')
      ..writeln('Recyclable (Score >= 0.60): $recyclable')
      ..writeln('Manual Sorting (Uncertain): $uncertain')
      ..writeln('Confidence Below 0.60 Cutoff: $belowThreshold')
      ..writeln('Mean Confidence Score: ${meanConfidence.toStringAsFixed(3)}')
      ..writeln('Network / Extraction Failures: $failures')
      ..writeln('\nDetailed Records:');

    for (int i = 0; i < _records.length; i++) {
      final r = _records[i];
      if (r.result != null) {
        buffer.writeln(
            '#${i + 1} | ${r.file.name} | ${r.result!.itemName} | ${r.result!.materialType} | Score: ${r.result!.confidenceScore.toStringAsFixed(2)} | Verdict: ${r.result!.isHappyPath ? "RECYCLABLE" : "MANUAL_SORTING"}');
      } else if (r.error != null) {
        buffer.writeln('#${i + 1} | ${r.file.name} | ERROR: ${r.error}');
      }
    }

    Clipboard.setData(ClipboardData(text: buffer.toString()));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Batch report copied to clipboard!'),
        backgroundColor: Color(0xFF059669),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final total = _records.length;
    final processed = _records.where((r) => r.result != null).toList();
    final recyclable = processed.where((r) => r.result!.isHappyPath).length;
    final uncertain = processed.where((r) => r.result!.isUncertain).length;
    final belowThreshold =
        processed.where((r) => r.result!.confidenceScore < 0.60).length;
    final failures = _records.where((r) => r.error != null).length;

    final meanConfidence = processed.isEmpty
        ? 0.0
        : (processed.fold<double>(
                0.0, (sum, r) => sum + r.result!.confidenceScore) /
            processed.length);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Batch Evaluator (Evidence)'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          if (_records.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.copy_rounded),
              tooltip: 'Copy Summary Text',
              onPressed: _copySummaryToClipboard,
            ),
        ],
      ),
      body: Column(
        children: [
          // Header summary card
          Container(
            margin: const EdgeInsets.all(16.0),
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Batch Test Benchmark',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    if (_isRunning)
                      Text(
                        'Processing $_currentIndex of $total...',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF059669),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildStatPill('Total', '$total', Colors.grey.shade800),
                    const SizedBox(width: 8),
                    _buildStatPill('Recyclable', '$recyclable', const Color(0xFF059669)),
                    const SizedBox(width: 8),
                    _buildStatPill('Uncertain', '$uncertain', Colors.amber.shade900),
                    const SizedBox(width: 8),
                    _buildStatPill('Mean Conf', meanConfidence.toStringAsFixed(2), Colors.blue.shade800),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      'Below 0.60 cutoff: $belowThreshold  •  Failures: $failures',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
                if (_isRunning) ...[
                  const SizedBox(height: 12),
                  LinearProgressIndicator(
                    value: total == 0 ? 0 : (_currentIndex / total),
                    color: const Color(0xFF059669),
                    backgroundColor: Colors.grey.shade200,
                  ),
                ],
              ],
            ),
          ),

          // Action controls: Select Multi-Images & Run Batch
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isRunning ? null : _pickBatchImages,
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Add Images'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: (_records.isEmpty || _isRunning)
                        ? null
                        : _runBatchEvaluation,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                    ),
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: const Text('Run Test'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),

          // Results Table / ListView
          Expanded(
            child: _records.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.checklist_rtl_rounded,
                            size: 48, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text(
                          'No images loaded for batch testing',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Select up to 20 images to evaluate classifier consistency.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16.0),
                    itemCount: _records.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final record = _records[index];
                      final res = record.result;
                      final isHappy = res?.isHappyPath;

                      return Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isHappy == true
                                ? const Color(0xFFA7F3D0)
                                : (isHappy == false
                                    ? Colors.amber.shade300
                                    : (record.error != null
                                        ? Colors.red.shade300
                                        : Colors.grey.shade300)),
                          ),
                        ),
                        child: Row(
                          children: [
                            // Thumbnail
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: kIsWeb
                                  ? const Icon(Icons.image_outlined)
                                  : Image.file(
                                      File(record.file.path),
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, _, _) => const Icon(
                                          Icons.image_not_supported_outlined),
                                    ),
                            ),
                            const SizedBox(width: 12),

                            // Image & Result Info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    res != null ? res.itemName : record.file.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  if (res != null) ...[
                                    Row(
                                      children: [
                                        Text(
                                          'Score: ${res.confidenceScore.toStringAsFixed(2)}',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: isHappy == true
                                                ? const Color(0xFF047857)
                                                : Colors.amber.shade900,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          res.materialType,
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Colors.grey.shade600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ] else if (record.error != null) ...[
                                    Text(
                                      'Error: ${record.error}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.red.shade800,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ] else if (record.isProcessing) ...[
                                    const Text(
                                      'Analyzing...',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Color(0xFF059669),
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ] else ...[
                                    Text(
                                      'Queued',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey.shade500,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),

                            // Verdict Badge
                            if (record.isProcessing)
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            else if (res != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: isHappy == true
                                      ? const Color(0xFFD1FAE5)
                                      : Colors.amber.shade100,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  isHappy == true ? 'RECYCLABLE' : 'UNCERTAIN',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isHappy == true
                                        ? const Color(0xFF065F46)
                                        : Colors.amber.shade900,
                                  ),
                                ),
                              )
                            else if (record.error != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade100,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'FAILED',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red.shade900,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatPill(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: color.withAlpha(200),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
