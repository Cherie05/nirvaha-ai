import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/scan_result.dart';
import '../providers/bin_provider.dart';
import '../providers/scan_provider.dart';
import '../widgets/scan_image.dart';
import '../widgets/ui_kit.dart';
import 'result_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  /// Pickups first: "what happened to my plastic" is the question people open
  /// this tab to answer. Scans are the supporting detail.
  static const _tabs = ['Pickups', 'Scans', 'Check by hand'];
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    final bin = context.watch<BinProvider>();

    final pickups = bin.pickupHistory;
    final scans = scanProvider.history;
    final uncertain = scans.where((s) => s.isUncertain).toList();

    return Scaffold(
      backgroundColor: Nv.canvas,
      body: RefreshIndicator(
        color: Nv.brand,
        onRefresh: () async {
          await scanProvider.refreshHistory();
          await bin.refresh();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: ScreenHeader(
                name: scanProvider.userName,
                eyebrow: pickups.isEmpty
                    ? '${scans.length} scan${scans.length == 1 ? '' : 's'} · no collections yet'
                    : '${pickups.length} collection${pickups.length == 1 ? '' : 's'} · '
                        '${bin.lifetimeKg.toStringAsFixed(2)} kg recycled',
                title: 'Activity',
                child: PillTabs(
                  labels: _tabs,
                  index: _tab,
                  onChanged: (i) => setState(() => _tab = i),
                ),
              ),
            ),

            if (_tab == 0)
              ..._pickupSlivers(pickups)
            else
              ..._scanSlivers(_tab == 1 ? scans : uncertain),
          ],
        ),
      ),
    );
  }

  List<Widget> _pickupSlivers(List<Map<String, dynamic>> pickups) {
    if (pickups.isEmpty) {
      return const [
        SliverFillRemaining(
          hasScrollBody: false,
          child: _EmptyState(
            icon: Icons.local_shipping_outlined,
            title: 'No collections yet',
            body: 'Once a vendor collects your bin, the trip is recorded here '
                'with everything that was in it.',
          ),
        ),
      ];
    }

    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
        sliver: SliverList.separated(
          itemCount: pickups.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (_, i) => _PickupTile(pickup: pickups[i]),
        ),
      ),
    ];
  }

  List<Widget> _scanSlivers(List<ScanResult> items) {
    if (items.isEmpty) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: _EmptyState(
            icon: _tab == 2
                ? Icons.check_circle_outline_rounded
                : Icons.photo_camera_outlined,
            title: _tab == 2 ? 'Nothing to sort by hand' : 'No scans yet',
            body: _tab == 2
                ? 'Items we were unsure about would appear here.'
                : 'Photograph a plastic item and it will appear here.',
          ),
        ),
      ];
    }

    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
        sliver: SliverList.separated(
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (_, i) => _HistoryTile(item: items[i]),
        ),
      ),
    ];
  }
}

/// One completed collection: when, where, how heavy, and what was in it.
class _PickupTile extends StatelessWidget {
  final Map<String, dynamic> pickup;
  const _PickupTile({required this.pickup});

  @override
  Widget build(BuildContext context) {
    final kg = (pickup['weightKg'] as num?)?.toDouble() ?? 0;
    final items = (pickup['itemCount'] as num?)?.toInt() ?? 0;
    final zone = (pickup['zone'] ?? '').toString();
    final when = DateTime.tryParse((pickup['collectedAt'] ?? '').toString());
    final breakdown = (pickup['breakdown'] as Map?) ?? const {};

    return SoftCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  color: Nv.brandSoft,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.recycling_rounded,
                    size: 21, color: Nv.brandDeep),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Collected from $zone',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                        color: Nv.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      when == null
                          ? '$items item${items == 1 ? '' : 's'}'
                          : '${DateFormat('MMM d, y · h:mm a').format(when.toLocal())}'
                              ' · $items item${items == 1 ? '' : 's'}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: Nv.faint),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '${kg.toStringAsFixed(2)} kg',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  color: Nv.brandDark,
                ),
              ),
            ],
          ),
          if (breakdown.isNotEmpty) ...[
            const SizedBox(height: 14),
            const Divider(height: 1, color: Nv.line),
            const SizedBox(height: 12),
            Wrap(
              spacing: 7,
              runSpacing: 7,
              children: breakdown.entries.map((e) {
                final v = (e.value as num?)?.toDouble() ?? 0;
                return SoftChip(
                  label: '${e.key} · ${v.toStringAsFixed(2)} kg',
                  fg: Nv.muted,
                  bg: const Color(0xFFF2F5F3),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  final ScanResult item;
  const _HistoryTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final isHappy = item.isHappyPath;
    final dateStr = item.scannedAt != null
        ? DateFormat('MMM d · h:mm a').format(item.scannedAt!.toLocal())
        : 'Recent';

    return SoftCard(
      padding: const EdgeInsets.all(14),
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ResultScreen(result: item)),
        );
      },
      child: Row(
        children: [
          SizedBox(
            width: 58,
            height: 58,
            child: Stack(
              children: [
                Positioned.fill(
                  child: ScanImage(
                    result: item,
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                Positioned(
                  right: -1,
                  bottom: -1,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: isHappy ? Nv.brand : Nv.amber,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Icon(
                      isHappy
                          ? Icons.recycling_rounded
                          : Icons.pan_tool_alt_rounded,
                      color: Colors.white,
                      size: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.itemName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                    color: Nv.ink,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  dateStr,
                  style: const TextStyle(fontSize: 11.5, color: Nv.faint),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    SoftChip(
                      label: isHappy ? item.formattedWeight : 'Check by hand',
                      fg: isHappy ? Nv.brandDark : const Color(0xFF92400E),
                      bg: isHappy ? Nv.brandSoft : Nv.amberSoft,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: SoftChip(
                        label: item.materialType,
                        fg: Nv.muted,
                        bg: const Color(0xFFF2F5F3),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Nv.faint),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String body;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(40, 40, 40, 120),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 76,
            height: 76,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: Nv.liftSmall,
            ),
            child: Icon(icon, size: 32, color: Nv.faint),
          ),
          const SizedBox(height: 18),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.4,
              color: Nv.ink,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, height: 1.45, color: Nv.muted),
          ),
        ],
      ),
    );
  }
}
