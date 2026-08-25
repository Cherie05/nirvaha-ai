import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import '../models/scan_result.dart';

/// Renders the photo behind a scan.
///
/// Prefers the on-device file (instant, no network, works with the tunnel
/// down) and falls back to the stored URL for history rows taken on another
/// device or after a reinstall. Never throws — a missing image degrades to a
/// neutral placeholder rather than a red error box.
class ScanImage extends StatelessWidget {
  final ScanResult result;
  final double? height;
  final double? width;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  const ScanImage({
    super.key,
    required this.result,
    this.height,
    this.width,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  bool get _hasLocal {
    final p = result.localImagePath;
    if (p == null || p.trim().isEmpty || kIsWeb) return false;
    try {
      return File(p).existsSync();
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(16);
    final url = result.imageUrl;

    Widget child;
    if (_hasLocal) {
      child = Image.file(
        File(result.localImagePath!),
        height: height,
        width: width,
        fit: fit,
        errorBuilder: (_, _, _) => _placeholder(context),
      );
    } else if (url != null && url.trim().isNotEmpty) {
      child = Image.network(
        url,
        height: height,
        width: width,
        fit: fit,
        headers: const {'ngrok-skip-browser-warning': 'true'},
        loadingBuilder: (context, w, progress) =>
            progress == null ? w : _loading(context),
        errorBuilder: (_, _, _) => _placeholder(context),
      );
    } else {
      child = _placeholder(context);
    }

    return ClipRRect(borderRadius: radius, child: child);
  }

  Widget _loading(BuildContext context) => Container(
        height: height,
        width: width,
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        alignment: Alignment.center,
        child: const SizedBox(
          height: 22,
          width: 22,
          child: CircularProgressIndicator(strokeWidth: 2.2),
        ),
      );

  Widget _placeholder(BuildContext context) => Container(
        height: height,
        width: width,
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        alignment: Alignment.center,
        child: Icon(
          Icons.image_not_supported_outlined,
          size: (height != null && height! < 80) ? 18 : 32,
          color: Colors.grey.shade500,
        ),
      );
}
