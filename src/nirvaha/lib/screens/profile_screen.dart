import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scan_provider.dart';
import '../providers/bin_provider.dart';
import '../widgets/ui_kit.dart';
import 'batch_test_screen.dart';
import 'login_screen.dart';
import 'settings_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _handleLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text(
          'Sign out of Nirvaha?',
          style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.4),
        ),
        content: const Text(
          'You will need your password to sign back in.',
          style: TextStyle(height: 1.45),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            style: TextButton.styleFrom(foregroundColor: Nv.muted),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Nv.danger,
              minimumSize: const Size(0, 44),
            ),
            onPressed: () async {
              Navigator.of(ctx).pop();
              // Navigating away is not logging out. The JWT and the previous
              // user's bin would survive, so the next person to sign in would
              // briefly see someone else's data.
              final scan = context.read<ScanProvider>();
              final bin = context.read<BinProvider>();
              await scan.logout();
              bin.reset();
              if (!context.mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    final bin = context.watch<BinProvider>();

    return Scaffold(
      backgroundColor: Nv.canvas,
      body: SingleChildScrollView(
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ScreenHeader(
              name: scanProvider.userName,
              eyebrow: scanProvider.userEmail.isNotEmpty
                  ? scanProvider.userEmail
                  : 'Signed in',
              title: 'Your account',
              actions: [
                RoundIconButton(
                  icon: Icons.tune_rounded,
                  tooltip: 'Advanced',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const SettingsScreen(),
                      ),
                    );
                  },
                ),
              ],
              child: SoftCard(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 15,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: Nv.brandSoft,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.place_rounded,
                          size: 19, color: Nv.brandDeep),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bin.zone,
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.2,
                              color: Nv.ink,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Your collection zone',
                            style: TextStyle(fontSize: 12, color: Nv.muted),
                          ),
                        ],
                      ),
                    ),
                    SoftChip(
                      label: bin.pickups == 0
                          ? 'No pickups yet'
                          : '${bin.pickups} pickup${bin.pickups == 1 ? '' : 's'}',
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: SectionHeader(title: 'What you have sorted'),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: StatTile(
                            icon: Icons.scale_rounded,
                            iconColor: Nv.brandDeep,
                            iconBg: Nv.brandSoft,
                            label: 'Scanned weight',
                            value: scanProvider.totalWeightRecycledKg
                                .toStringAsFixed(2),
                            unit: 'Kg',
                            footer: 'Recyclable items only',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatTile(
                            icon: Icons.qr_code_scanner_rounded,
                            iconColor: Nv.indigo,
                            iconBg: Nv.indigoSoft,
                            label: 'Scans',
                            value: '${scanProvider.totalItemsCount}',
                            unit: 'items',
                            footer: 'All time',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: StatTile(
                            icon: Icons.recycling_rounded,
                            iconColor: Nv.brand,
                            iconBg: Nv.brandSoft,
                            label: 'Recyclable',
                            value: '${scanProvider.recyclableCount}',
                            unit: 'items',
                            footer: 'Confidence 0.60 and above',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatTile(
                            icon: Icons.pan_tool_alt_rounded,
                            iconColor: Nv.amber,
                            iconBg: Nv.amberSoft,
                            label: 'Check by hand',
                            value: '${scanProvider.uncertainCount}',
                            unit: 'items',
                            footer: 'Below 0.60 confidence',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 26),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: SectionHeader(title: 'Tools'),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SoftCard(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 6,
                ),
                child: Column(
                  children: [
                    SoftRow(
                      icon: Icons.fact_check_outlined,
                      iconColor: Nv.indigo,
                      iconBg: Nv.indigoSoft,
                      title: 'Batch evaluator',
                      subtitle: 'Run the accuracy benchmark',
                      trailing: const Icon(Icons.chevron_right_rounded,
                          color: Nv.faint),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const BatchTestScreen(),
                          ),
                        );
                      },
                    ),
                    const Divider(height: 1, color: Nv.line),
                    SoftRow(
                      icon: Icons.tune_rounded,
                      iconColor: Nv.muted,
                      iconBg: const Color(0xFFF2F5F3),
                      title: 'Advanced',
                      subtitle: 'Connection and diagnostics',
                      trailing: const Icon(Icons.chevron_right_rounded,
                          color: Nv.faint),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const SettingsScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 26),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: OutlinedButton.icon(
                onPressed: () => _handleLogout(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Nv.danger,
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFFF3D6D6)),
                  minimumSize: const Size(0, 52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                icon: const Icon(Icons.logout_rounded, size: 19),
                label: const Text(
                  'Sign out',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.2,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Center(
              child: Text(
                'Nirvaha · Coimbatore pilot',
                style: TextStyle(fontSize: 11.5, color: Nv.faint),
              ),
            ),
            const SizedBox(height: 110),
          ],
        ),
      ),
    );
  }
}
