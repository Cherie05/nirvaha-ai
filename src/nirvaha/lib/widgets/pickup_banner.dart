import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/bin_provider.dart';
import 'ui_kit.dart';

/// The one-line answer to "what is happening with my plastic right now".
///
/// Driven entirely by the bin's server-side status rather than by a flag set
/// when a button was tapped, so it cannot claim a pickup was requested when
/// the request never landed — and it survives closing the app.
class PickupBanner extends StatelessWidget {
  const PickupBanner({super.key});

  /// "just now" / "12 minutes ago" / "3 hours ago" / "2 days ago".
  static String ago(DateTime? t) {
    if (t == null) return '';
    final d = DateTime.now().difference(t.toLocal());
    if (d.inMinutes < 1) return 'just now';
    if (d.inMinutes < 60) {
      return '${d.inMinutes} minute${d.inMinutes == 1 ? '' : 's'} ago';
    }
    if (d.inHours < 24) {
      return '${d.inHours} hour${d.inHours == 1 ? '' : 's'} ago';
    }
    return '${d.inDays} day${d.inDays == 1 ? '' : 's'} ago';
  }

  @override
  Widget build(BuildContext context) {
    final bin = context.watch<BinProvider>();

    final ({IconData icon, String title, String body, Color fg, Color bg})? s =
        switch (bin.status) {
      'REQUESTED' => (
          icon: Icons.check_circle_rounded,
          title: 'Pickup requested',
          body: 'Waiting for a vendor to collect · asked '
              '${ago(bin.requestedAt)}',
          fg: Nv.indigo,
          bg: Nv.indigoSoft,
        ),
      'SCHEDULED' => (
          icon: Icons.local_shipping_rounded,
          title: 'A vendor is on the way',
          body: '${bin.scheduledKg.toStringAsFixed(2)} kg claimed from '
              '${bin.zone}. Leave it where it can be collected.',
          fg: Nv.indigo,
          bg: Nv.indigoSoft,
        ),
      // Only worth saying while it is still news. A permanent "collected"
      // banner would sit there for weeks and stop meaning anything.
      'COLLECTED'
          when bin.lastCollectedAt != null &&
              DateTime.now()
                      .difference(bin.lastCollectedAt!.toLocal())
                      .inHours <
                  48 =>
        (
          icon: Icons.recycling_rounded,
          title: 'Collected — thank you',
          body: 'Your bin is empty. '
              '${bin.lifetimeKg.toStringAsFixed(2)} kg recycled in total.',
          fg: Nv.brandDark,
          bg: Nv.brandSoft,
        ),
      _ => null,
    };

    // Owns its own outer spacing so a caller never leaves a gap where a
    // hidden banner used to be.
    if (s == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 18, 20, 0),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: BoxDecoration(
        color: s.bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(190),
              shape: BoxShape.circle,
            ),
            child: Icon(s.icon, size: 18, color: s.fg),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.2,
                    color: s.fg,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  s.body,
                  style: TextStyle(
                    fontSize: 12.5,
                    height: 1.4,
                    color: s.fg.withAlpha(215),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
