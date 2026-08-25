import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/bin_provider.dart';
import '../providers/scan_provider.dart';
import '../widgets/ui_kit.dart';

/// Lifetime impact and the milestones it unlocks.
///
/// Every figure here counts waste a vendor actually COLLECTED, never what was
/// merely scanned — photographing the same bottle twice must not move it.
class MilestonesScreen extends StatelessWidget {
  const MilestonesScreen({super.key});

  static const _icons = {
    'seedling': Icons.eco_rounded,
    'recycle': Icons.recycling_rounded,
    'trophy': Icons.emoji_events_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final bin = context.watch<BinProvider>();
    final scan = context.watch<ScanProvider>();

    final achieved = bin.badges.where((m) => m['achieved'] == true).length;

    return Scaffold(
      backgroundColor: Nv.canvas,
      body: RefreshIndicator(
        color: Nv.brand,
        onRefresh: bin.refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ScreenHeader(
                name: scan.userName,
                eyebrow: bin.badges.isEmpty
                    ? 'Recycle to unlock rewards'
                    : '$achieved of ${bin.badges.length} unlocked',
                title: 'Milestones',
                child: _LifetimeCard(bin: bin),
              ),

              const SizedBox(height: 26),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: SectionHeader(title: 'Your progress'),
              ),
              const SizedBox(height: 12),

              if (bin.nextMilestone != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: SoftCard(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Next: ${bin.nextMilestone}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
                                  color: Nv.ink,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${bin.lifetimeKg.toStringAsFixed(1)} / '
                              '${bin.nextMilestoneKg.toStringAsFixed(0)} kg',
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: Nv.muted,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SoftBar(value: bin.milestoneProgress, height: 10),
                        const SizedBox(height: 10),
                        Text(
                          '${(bin.nextMilestoneKg - bin.lifetimeKg).clamp(0, double.infinity).toStringAsFixed(2)} kg to go.',
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: Nv.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: SoftCard(
                    padding: EdgeInsets.all(18),
                    child: Row(
                      children: [
                        Icon(Icons.emoji_events_rounded,
                            color: Nv.brand, size: 22),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Every milestone unlocked. You are a zone champion.',
                            style: TextStyle(
                              fontSize: 13.5,
                              height: 1.45,
                              fontWeight: FontWeight.w600,
                              color: Nv.ink,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 26),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: SectionHeader(title: 'All milestones'),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SoftCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ),
                  child: bin.badges.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.symmetric(vertical: 14),
                          child: Text(
                            'Milestones appear once your first bin is '
                            'collected.',
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.45,
                              color: Nv.muted,
                            ),
                          ),
                        )
                      : Column(
                          children: [
                            for (var i = 0; i < bin.badges.length; i++) ...[
                              if (i > 0)
                                const Divider(height: 1, color: Nv.line),
                              _MilestoneRow(badge: bin.badges[i]),
                            ],
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 26),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: SectionHeader(title: 'How this is counted'),
              ),
              const SizedBox(height: 12),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: SoftCard(
                  padding: EdgeInsets.all(18),
                  child: Text(
                    'Only plastic a collector has actually picked up counts '
                    'towards these. Scanning an item shows you what it is — '
                    'it does not move your total until the bin leaves your '
                    'door.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.55,
                      color: Nv.muted,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 110),
            ],
          ),
        ),
      ),
    );
  }
}

/// The headline number, sitting on the header wash like the reference's
/// hero stat block.
class _LifetimeCard extends StatelessWidget {
  final BinProvider bin;
  const _LifetimeCard({required this.bin});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Nv.brand, Nv.brandDark],
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40065F46),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Recycled for real',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withAlpha(180),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      bin.lifetimeKg.toStringAsFixed(2),
                      style: const TextStyle(
                        fontSize: 40,
                        height: 1,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1.8,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'kg',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Colors.white.withAlpha(170),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  bin.pickups == 0
                      ? 'Counted after your first collection'
                      : 'Across ${bin.pickups} collection'
                          '${bin.pickups == 1 ? '' : 's'}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withAlpha(180),
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(38),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.recycling_rounded,
              color: Colors.white,
              size: 27,
            ),
          ),
        ],
      ),
    );
  }
}

class _MilestoneRow extends StatelessWidget {
  final Map<String, dynamic> badge;
  const _MilestoneRow({required this.badge});

  @override
  Widget build(BuildContext context) {
    final achieved = badge['achieved'] == true;
    final label = (badge['label'] ?? '').toString();
    final kg = (badge['kg'] as num?)?.toDouble() ?? 0;

    return SoftRow(
      icon: achieved
          ? (MilestonesScreen._icons[badge['icon']] ?? Icons.star_rounded)
          : Icons.lock_outline_rounded,
      iconColor: achieved ? Nv.brandDeep : Nv.faint,
      iconBg: achieved ? Nv.brandSoft : const Color(0xFFF2F5F3),
      title: label,
      subtitle: achieved
          ? 'Unlocked'
          : 'Reach ${kg.toStringAsFixed(0)} kg collected',
      trailing: achieved
          ? const Icon(Icons.check_circle_rounded, size: 20, color: Nv.brand)
          : Text(
              '${kg.toStringAsFixed(0)} kg',
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: Nv.faint,
              ),
            ),
    );
  }
}
