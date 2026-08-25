import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/bin_provider.dart';
import 'ui_kit.dart';

/// The Digital Bin progress card.
///
/// A single household's plastic is never worth a vendor's trip. Showing the
/// running total against a profitable threshold is what turns "throw it out"
/// into "set it aside until it's worth collecting".
class DigitalBinCard extends StatelessWidget {
  const DigitalBinCard({super.key});

  Future<void> _request(BuildContext context, BinProvider bin) async {
    final res = await bin.requestPickup();
    if (!context.mounted) return;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          backgroundColor: res.ok ? Nv.brandDeep : Nv.danger,
          content: Row(
            children: [
              Icon(
                res.ok ? Icons.check_circle_rounded : Icons.error_outline_rounded,
                color: Colors.white,
                size: 19,
              ),
              const SizedBox(width: 10),
              Expanded(child: Text(res.message)),
            ],
          ),
          duration: const Duration(seconds: 4),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final bin = context.watch<BinProvider>();
    final unlocked = bin.isUnlocked;
    final awaiting = bin.isAwaitingCollection;
    final barColor = awaiting
        ? Nv.indigo
        : unlocked
            ? Nv.brand
            : Nv.amber;

    return SoftCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // What actually happened to this bin. Without it the bar silently
          // drops to zero after a vendor claims and reads as data loss.
          Row(
            children: [
              Flexible(
                child: SoftChip(
                  label: bin.statusLabel,
                  icon: _chipIcon(bin.status),
                  fg: _chipFg(bin.status),
                  bg: _chipBg(bin.status),
                ),
              ),
              const Spacer(),
              if (bin.itemCount > 0)
                Text(
                  '${bin.itemCount} item${bin.itemCount == 1 ? '' : 's'}',
                  style: const TextStyle(fontSize: 12, color: Nv.faint),
                ),
            ],
          ),
          const SizedBox(height: 18),

          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                (bin.isScheduled ? bin.scheduledKg : bin.totalBinWeightKg)
                    .toStringAsFixed(2),
                style: const TextStyle(
                  fontSize: 38,
                  height: 1,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -1.6,
                  color: Nv.ink,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                bin.isScheduled
                    ? 'kg out for collection'
                    : 'of ${bin.thresholdKg.toStringAsFixed(1)} kg',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Nv.faint,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          SoftBar(
            value: bin.isScheduled ? 1.0 : bin.progress,
            color: barColor,
            height: 10,
          ),
          const SizedBox(height: 10),

          Text(
            bin.statusDetail,
            style: const TextStyle(fontSize: 12.5, height: 1.4, color: Nv.muted),
          ),

          if (bin.breakdown.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 7,
              runSpacing: 7,
              children: bin.breakdown.entries.map((e) {
                return SoftChip(
                  label: '${e.key} · ${(e.value / 1000).toStringAsFixed(2)} kg',
                  fg: Nv.muted,
                  bg: const Color(0xFFF2F5F3),
                );
              }).toList(),
            ),
          ],

          const SizedBox(height: 18),

          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              // Enabled only when there is genuinely something to ask for. A
              // button that always "succeeds" taught the user nothing.
              onPressed: (unlocked && !awaiting && !bin.isRequesting)
                  ? () => _request(context, bin)
                  : null,
              style: FilledButton.styleFrom(
                backgroundColor: Nv.brand,
                disabledBackgroundColor: awaiting
                    ? Nv.indigoSoft
                    : const Color(0xFFEDF1EF),
                disabledForegroundColor: awaiting ? Nv.indigo : Nv.faint,
                minimumSize: const Size(0, 52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: bin.isRequesting
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : Icon(_buttonIcon(bin), size: 19),
              label: Text(
                _buttonLabel(bin),
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _buttonLabel(BinProvider bin) {
    if (bin.isRequesting) return 'Requesting…';
    if (bin.isScheduled) return 'Vendor on the way';
    if (bin.isRequested) return 'Waiting for pickup';
    if (bin.isUnlocked) return 'Request pickup';
    return 'Add more to unlock pickup';
  }

  IconData _buttonIcon(BinProvider bin) {
    if (bin.isScheduled) return Icons.local_shipping_rounded;
    if (bin.isRequested) return Icons.hourglass_top_rounded;
    if (bin.isUnlocked) return Icons.local_shipping_rounded;
    return Icons.lock_outline_rounded;
  }

  Color _chipBg(String s) => switch (s) {
        'REQUESTED' => Nv.indigoSoft,
        'SCHEDULED' => Nv.indigoSoft,
        'COLLECTED' => Nv.brandSoft,
        'READY' => Nv.brandSoft,
        _ => Nv.amberSoft,
      };

  Color _chipFg(String s) => switch (s) {
        'REQUESTED' => Nv.indigo,
        'SCHEDULED' => Nv.indigo,
        'COLLECTED' => Nv.brandDark,
        'READY' => Nv.brandDark,
        _ => const Color(0xFF92400E),
      };

  IconData _chipIcon(String s) => switch (s) {
        'REQUESTED' => Icons.hourglass_top_rounded,
        'SCHEDULED' => Icons.local_shipping_rounded,
        'COLLECTED' => Icons.recycling_rounded,
        'READY' => Icons.check_circle_rounded,
        _ => Icons.inventory_2_outlined,
      };
}
