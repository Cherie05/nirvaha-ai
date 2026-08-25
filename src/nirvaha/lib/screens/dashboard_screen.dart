import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/scan_provider.dart';
import 'result_screen.dart';
import '../widgets/digital_bin_card.dart';
import '../widgets/pickup_banner.dart';
import '../widgets/ui_kit.dart';
import '../providers/bin_provider.dart';

class DashboardScreen extends StatefulWidget {
  /// Lets the header's round buttons move between tabs. Optional so the screen
  /// still builds standalone in tests.
  final ValueChanged<int>? onOpenTab;

  const DashboardScreen({super.key, this.onOpenTab});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    // Verify connection on dashboard mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ScanProvider>(context, listen: false).checkBackendHealth();
      Provider.of<BinProvider>(context, listen: false).refresh();
    });
  }

  Future<void> _initiateScan(ImageSource source) async {
    try {
      // 1024x1024 image dimension for faster uploads on village mobile connections
      final XFile? photo = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (photo == null || !mounted) return;

      final scanProvider = Provider.of<ScanProvider>(context, listen: false);

      // Display real AI analysis dialog with honest copy
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => PopScope(
          canPop: false,
          child: Dialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(26),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 34),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Nv.brandSoft,
                      shape: BoxShape.circle,
                    ),
                    child: const CircularProgressIndicator(
                      strokeWidth: 3.5,
                      color: Nv.brand,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Looking at your photo',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.4,
                      color: Nv.ink,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'This usually takes a few seconds',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: Nv.muted),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      // Perform real AI scan via backend
      final result = await scanProvider.scanImage(photo);

      if (!mounted) return;
      // Dismiss loading dialog
      Navigator.of(context, rootNavigator: true).pop();

      if (result != null) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ResultScreen(result: result),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              scanProvider.errorMessage ??
                  "Couldn't read that photo. Try again in better light.",
            ),
            backgroundColor: Nv.danger,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        Navigator.of(context, rootNavigator: true).maybePop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open the camera.'),
            backgroundColor: Nv.danger,
          ),
        );
      }
    }
  }

  void _showScanSourceSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: Nv.line,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Take a photo',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  color: Nv.ink,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Photograph your plastic and we will tell you if it can be '
                'recycled.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, height: 1.4, color: Nv.muted),
              ),
              const SizedBox(height: 20),
              SoftRow(
                icon: Icons.camera_alt_rounded,
                iconColor: Nv.brand,
                iconBg: Nv.brandSoft,
                title: 'Use camera',
                subtitle: 'Take a new photo of the item',
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: Nv.faint),
                onTap: () {
                  Navigator.pop(ctx);
                  _initiateScan(ImageSource.camera);
                },
              ),
              const Divider(height: 1, color: Nv.line),
              SoftRow(
                icon: Icons.photo_library_rounded,
                iconColor: Nv.indigo,
                iconBg: Nv.indigoSoft,
                title: 'Choose from gallery',
                subtitle: 'Select a saved picture',
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: Nv.faint),
                onTap: () {
                  Navigator.pop(ctx);
                  _initiateScan(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// How many items were scanned today, for the header line. Derived from the
  /// same history the History tab shows — nothing invented.
  int _scansToday(ScanProvider scan) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return scan.history.where((s) {
      final t = s.scannedAt;
      if (t == null) return false;
      return DateTime(t.year, t.month, t.day) == today;
    }).length;
  }

  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    final bin = context.watch<BinProvider>();

    final isConnected = scanProvider.isConnected;
    final scansToday = _scansToday(scanProvider);

    return Scaffold(
      backgroundColor: Nv.canvas,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(0),
        child: Container(),
      ),
      body: RefreshIndicator(
        color: Nv.brand,
        onRefresh: () async {
          await scanProvider.checkBackendHealth();
          await scanProvider.refreshHistory();
          await bin.refresh();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ScreenHeader(
                name: scanProvider.userName,
                eyebrow: scansToday == 0
                    ? 'Nothing sorted today yet'
                    : '$scansToday item${scansToday == 1 ? '' : 's'} sorted today',
                title: 'Welcome back',
                actions: [
                  RoundIconButton(
                    icon: Icons.emoji_events_outlined,
                    tooltip: 'Milestones',
                    onTap: () => widget.onOpenTab?.call(1),
                  ),
                  RoundIconButton(
                    icon: Icons.person_outline_rounded,
                    tooltip: 'Profile',
                    onTap: () => widget.onOpenTab?.call(3),
                  ),
                ],
                child: ActionPill(
                  icon: Icons.auto_awesome_rounded,
                  label: 'Scan your plastic with AI',
                  onTap: _showScanSourceSheet,
                ),
              ),

              // Offline notice. Only appears when something is genuinely wrong;
              // a working app has nothing to say about its own plumbing.
              if (isConnected == false)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Nv.dangerSoft,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.wifi_off_rounded,
                            size: 19, color: Nv.danger),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            "Can't reach Nirvaha. Check your internet, then "
                            'pull down to refresh.',
                            style: TextStyle(
                              fontSize: 12.5,
                              height: 1.35,
                              color: Nv.danger,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Where the plastic stands right now: requested, on its way, or
              // just collected. Renders nothing when there is nothing to say.
              const PickupBanner(),

              const SizedBox(height: 26),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: SectionHeader(title: 'Your numbers'),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: StatTile(
                          icon: Icons.delete_outline_rounded,
                          iconColor: Nv.amber,
                          iconBg: Nv.amberSoft,
                          label: 'In your bin',
                          value: bin.totalBinWeightKg.toStringAsFixed(2),
                          unit: 'Kg',
                          footer: bin.isUnlocked
                              ? 'Ready for pickup'
                              : '${(bin.remainingGrams / 1000).toStringAsFixed(2)} kg to go',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: StatTile(
                          icon: Icons.recycling_rounded,
                          iconColor: Nv.brandDeep,
                          iconBg: Nv.brandSoft,
                          label: 'Recycled',
                          value: bin.lifetimeKg.toStringAsFixed(2),
                          unit: 'Kg',
                          footer: bin.pickups == 0
                              ? 'After your first pickup'
                              : '${bin.pickups} pickup${bin.pickups == 1 ? '' : 's'}',
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 26),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SectionHeader(
                  title: 'Digital bin',
                  actionLabel: bin.zone,
                ),
              ),
              const SizedBox(height: 12),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: DigitalBinCard(),
              ),

              const SizedBox(height: 26),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SectionHeader(
                  title: 'Next milestone',
                  actionLabel: 'View all',
                  onAction: () => widget.onOpenTab?.call(1),
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SoftCard(
                  padding: const EdgeInsets.all(18),
                  onTap: () => widget.onOpenTab?.call(1),
                  child: bin.nextMilestone == null
                      ? const Row(
                          children: [
                            Icon(Icons.emoji_events_rounded,
                                color: Nv.brand, size: 20),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Every milestone unlocked.',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w600,
                                  color: Nv.ink,
                                ),
                              ),
                            ),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    bin.nextMilestone!,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: -0.2,
                                      color: Nv.ink,
                                    ),
                                  ),
                                ),
                                Text(
                                  '${bin.lifetimeKg.toStringAsFixed(1)} / '
                                  '${bin.nextMilestoneKg.toStringAsFixed(0)} kg',
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                    color: Nv.muted,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 11),
                            SoftBar(value: bin.milestoneProgress),
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 110),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showScanSourceSheet,
        elevation: 3,
        backgroundColor: Nv.brand,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        icon: const Icon(Icons.camera_alt_rounded, size: 20),
        label: const Text(
          'Take a photo',
          style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: -0.2),
        ),
      ),
    );
  }
}
