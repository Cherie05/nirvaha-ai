import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/scan_result.dart';
import '../providers/bin_provider.dart';
import '../widgets/scan_image.dart';
import '../widgets/ui_kit.dart';

/// The verdict for one photo.
///
/// The photo leads, the answer follows, and the single next action sits pinned
/// at the bottom where a thumb can reach it. Nothing about confidence or
/// material is softened — an uncertain result says so plainly.
class ResultScreen extends StatelessWidget {
  final ScanResult result;

  const ResultScreen({super.key, required this.result});

  /// Launch email pickup request via url_launcher
  Future<void> _launchEmailPickupRequest(BuildContext context) async {
    final subject =
        Uri.encodeComponent('Nirvaha Pickup Request: ${result.itemName}');
    final body = Uri.encodeComponent(
      'Hello Nirvaha Team,\n\n'
      'I would like to request a plastic pickup for the following item:\n\n'
      'Item: ${result.itemName}\n'
      'Material: ${result.materialType}\n'
      'Quantity: ${result.quantity}\n'
      'Estimated Weight: ${result.formattedWeight}\n'
      'Confidence: ${result.confidenceScore.toStringAsFixed(2)}\n\n'
      'Please let me know when pickup is available.\n'
      'Thank you.',
    );

    final emailUri =
        Uri.parse('mailto:pickup@nirvaha.eco?subject=$subject&body=$body');

    try {
      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri, mode: LaunchMode.externalApplication);
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No email app found to send a pickup request.'),
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open your email app.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isHappy = result.isHappyPath;

    return Scaffold(
      backgroundColor: Nv.canvas,
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.zero,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Hero(result: result),

                // The white sheet rides up over the photo.
                Transform.translate(
                  offset: const Offset(0, -26),
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Nv.canvas,
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(28)),
                    ),
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Permanent banner if the result was simulated.
                        if (result.isMock) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                              vertical: 10,
                              horizontal: 16,
                            ),
                            decoration: BoxDecoration(
                              color: Nv.danger,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'SIMULATED — NOT REAL AI',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                                fontSize: 12.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                        ],

                        Row(
                          children: [
                            SoftChip(
                              label: isHappy ? 'Recyclable' : 'Check by hand',
                              icon: isHappy
                                  ? Icons.check_circle_rounded
                                  : Icons.pan_tool_alt_rounded,
                              fg: isHappy
                                  ? Nv.brandDark
                                  : const Color(0xFF92400E),
                              bg: isHappy ? Nv.brandSoft : Nv.amberSoft,
                            ),
                            const SizedBox(width: 7),
                            SoftChip(
                              label:
                                  'Confidence ${result.confidenceScore.toStringAsFixed(2)}',
                              fg: Nv.muted,
                              bg: const Color(0xFFF2F5F3),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        Text(
                          result.itemName,
                          style: const TextStyle(
                            fontSize: 26,
                            height: 1.15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -1.0,
                            color: Nv.ink,
                          ),
                        ),
                        if (!isHappy) ...[
                          const SizedBox(height: 8),
                          const Text(
                            'Uncertain Material: Manual Sorting Required.',
                            style: TextStyle(
                              fontSize: 15,
                              height: 1.45,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF92400E),
                            ),
                          ),
                        ],

                        const SizedBox(height: 20),

                        if (isHappy) ...[
                          SoftCard(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Text(
                                      'How to recycle it',
                                      style: TextStyle(
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: -0.2,
                                        color: Nv.ink,
                                      ),
                                    ),
                                    const Spacer(),
                                    SoftChip(label: result.materialType),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  result.recyclingInstructions,
                                  style: const TextStyle(
                                    fontSize: 13.5,
                                    height: 1.55,
                                    color: Nv.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else ...[
                          SoftCard(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'What to do',
                                  style: TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.2,
                                    color: Nv.ink,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Keep this item aside until someone can '
                                  'check it.',
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    height: 1.5,
                                    color: Nv.muted,
                                  ),
                                ),
                                const SizedBox(height: 14),
                                const Divider(height: 1, color: Nv.line),
                                const SizedBox(height: 12),
                                const Text(
                                  'Why am I seeing this?',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: Nv.ink,
                                  ),
                                ),
                                const SizedBox(height: 5),
                                Text(
                                  'Nirvaha was '
                                  '${(result.confidenceScore * 100).toStringAsFixed(0)}% '
                                  'confident, below our 0.60 cutoff. A wrong '
                                  'answer sends recyclable plastic to landfill '
                                  'or contaminates a recycler\'s batch, so we '
                                  'would rather say we do not know.',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    height: 1.5,
                                    color: Nv.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        if (isHappy) ...[
                          const SizedBox(height: 12),
                          Center(
                            child: TextButton.icon(
                              onPressed: () =>
                                  _launchEmailPickupRequest(context),
                              style: TextButton.styleFrom(
                                foregroundColor: Nv.muted,
                              ),
                              icon: const Icon(Icons.mail_outline_rounded,
                                  size: 17),
                              label: const Text(
                                'Email a pickup request instead',
                                style: TextStyle(fontSize: 13),
                              ),
                            ),
                          ),
                        ],

                        const SizedBox(height: 130),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Back button floating over the photo.
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            child: RoundIconButton(
              icon: Icons.arrow_back_rounded,
              tooltip: 'Back',
              onTap: () => Navigator.of(context).pop(),
            ),
          ),

          // Sticky action bar.
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _ActionBar(result: result, isHappy: isHappy),
          ),
        ],
      ),
    );
  }
}

/// Full-bleed photo with the two facts that matter floating over its base.
class _Hero extends StatelessWidget {
  final ScanResult result;
  const _Hero({required this.result});

  @override
  Widget build(BuildContext context) {
    final isHappy = result.isHappyPath;

    return SizedBox(
      height: 330,
      child: Stack(
        fit: StackFit.expand,
        children: [
          ScanImage(
            result: result,
            height: 330,
            borderRadius:
                const BorderRadius.vertical(bottom: Radius.circular(28)),
          ),
          // Scrim so the white back button and the chips stay legible on any
          // photo, bright or dark.
          const DecoratedBox(
            decoration: BoxDecoration(
              borderRadius:
                  BorderRadius.vertical(bottom: Radius.circular(28)),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x33000000), Color(0x00000000), Color(0x55000000)],
                stops: [0.0, 0.35, 1.0],
              ),
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 46,
            child: Row(
              children: [
                _GlassFact(
                  icon: isHappy
                      ? Icons.scale_rounded
                      : Icons.help_outline_rounded,
                  label: isHappy ? 'Weight' : 'Verdict',
                  value: isHappy ? result.formattedWeight : 'Uncertain',
                ),
                const SizedBox(width: 10),
                _GlassFact(
                  icon: isHappy
                      ? Icons.tag_rounded
                      : Icons.category_rounded,
                  label: isHappy ? 'Quantity' : 'Material',
                  value: isHappy ? '${result.quantity}' : 'Unconfirmed',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassFact extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _GlassFact({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(235),
          borderRadius: BorderRadius.circular(18),
          boxShadow: Nv.liftSmall,
        ),
        child: Row(
          children: [
            Icon(icon, size: 17, color: Nv.brandDeep),
            const SizedBox(width: 9),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(fontSize: 10.5, color: Nv.faint),
                  ),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.2,
                      color: Nv.ink,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Pinned bar: the running bin total on the left, the one action on the right.
class _ActionBar extends StatelessWidget {
  final ScanResult result;
  final bool isHappy;

  const _ActionBar({required this.result, required this.isHappy});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        boxShadow: [
          BoxShadow(
            color: Color(0x1A0B1F14),
            blurRadius: 26,
            offset: Offset(0, -8),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        16 + MediaQuery.of(context).padding.bottom,
      ),
      child: Consumer<BinProvider>(
        builder: (context, bin, _) {
          if (!isHappy) {
            return SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                style: FilledButton.styleFrom(
                  backgroundColor: Nv.ink,
                  minimumSize: const Size(0, 54),
                ),
                child: const Text('Back to home'),
              ),
            );
          }

          // One scan, one bin entry. Opening an old scan from History must
          // not offer to count the same plastic again.
          final alreadyBinned = bin.containsScan(result.id);

          return Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'In your bin',
                    style: TextStyle(fontSize: 11.5, color: Nv.faint),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${bin.totalBinWeightKg.toStringAsFixed(2)} kg',
                    style: const TextStyle(
                      fontSize: 20,
                      height: 1,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.8,
                      color: Nv.ink,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 18),
              Expanded(
                child: FilledButton.icon(
                  onPressed: (bin.isAdding || alreadyBinned)
                      ? null
                      : () async {
                          final res = await bin.addToBin(result);
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor:
                                  res.ok ? Nv.brandDeep : Nv.amber,
                              content: Text(
                                res.ok
                                    ? 'Added ${result.formattedWeight} — '
                                        '${bin.totalBinWeightKg.toStringAsFixed(2)} kg of '
                                        '${bin.thresholdKg.toStringAsFixed(1)} kg'
                                    : (res.message ??
                                        'Could not add to bin.'),
                              ),
                            ),
                          );
                          if (res.ok) Navigator.of(context).pop();
                        },
                  style: FilledButton.styleFrom(
                    backgroundColor: Nv.brand,
                    disabledBackgroundColor: Nv.brandSoft,
                    disabledForegroundColor: Nv.brandDeep,
                    minimumSize: const Size(0, 54),
                  ),
                  icon: bin.isAdding
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: Colors.white,
                          ),
                        )
                      : Icon(
                          alreadyBinned
                              ? Icons.check_circle_rounded
                              : Icons.add_rounded,
                          size: 19,
                        ),
                  label: Text(alreadyBinned ? 'In your bin' : 'Add to bin'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
