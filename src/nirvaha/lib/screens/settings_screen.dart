import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scan_provider.dart';
import '../widgets/ui_kit.dart';

/// Where the app points itself.
///
/// Deliberately out of the way. A household never needs this, but the tunnel
/// address does change between demos, so the escape hatch stays — worded for a
/// person rather than for whoever wired it up.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _urlController;
  bool _isTesting = false;
  String? _testResult;
  bool? _testSuccess;

  @override
  void initState() {
    super.initState();
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    _urlController = TextEditingController(text: scanProvider.backendUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    setState(() {
      _isTesting = true;
      _testResult = null;
      _testSuccess = null;
    });

    // Save and test
    await scanProvider.setBackendUrl(_urlController.text);
    final latency = await scanProvider.checkBackendHealth();

    if (!mounted) return;
    setState(() {
      _isTesting = false;
      if (latency != null) {
        _testSuccess = true;
        _testResult = 'Connected. Responded in $latency ms.';
      } else {
        _testSuccess = false;
        _testResult =
            'No answer from that address. Check it is correct and that you '
            'have internet, then try again.';
      }
    });
  }

  Future<void> _saveUrl() async {
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    await scanProvider.setBackendUrl(_urlController.text);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Saved.'), backgroundColor: Nv.brandDeep),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    final isConnected = scanProvider.isConnected;

    final (statusLabel, statusDetail, statusIcon, statusFg, statusBg) =
        switch (isConnected) {
      true => (
          'Connected',
          scanProvider.lastLatencyMs != null
              ? 'Responded in ${scanProvider.lastLatencyMs} ms'
              : 'Ready to scan',
          Icons.check_circle_rounded,
          Nv.brandDark,
          Nv.brandSoft,
        ),
      false => (
          'Not connected',
          'The app cannot reach Nirvaha right now',
          Icons.wifi_off_rounded,
          Nv.danger,
          Nv.dangerSoft,
        ),
      _ => (
          'Checking',
          'Testing the connection',
          Icons.hourglass_bottom_rounded,
          Nv.muted,
          const Color(0xFFF2F5F3),
        ),
    };

    return Scaffold(
      backgroundColor: Nv.canvas,
      appBar: AppBar(
        title: const Text('Advanced'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SoftCard(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: statusBg,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(statusIcon, color: statusFg, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          statusLabel,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                            color: Nv.ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          statusDetail,
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: Nv.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 26),

            const SectionHeader(title: 'Server address'),
            const SizedBox(height: 6),
            const Text(
              'Only change this if you are told to. It is remembered for '
              'next time.',
              style: TextStyle(fontSize: 13, height: 1.45, color: Nv.muted),
            ),
            const SizedBox(height: 14),

            SoftCard(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _urlController,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Nv.ink,
                    ),
                    decoration: InputDecoration(
                      hintText: 'https://…',
                      hintStyle: const TextStyle(color: Nv.faint),
                      prefixIcon:
                          const Icon(Icons.link_rounded, size: 20, color: Nv.faint),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.clear_rounded,
                            size: 19, color: Nv.faint),
                        onPressed: () => _urlController.clear(),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF6F8F7),
                      contentPadding: const EdgeInsets.symmetric(vertical: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFECF0EE)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Nv.brand, width: 1.6),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isTesting ? null : _testConnection,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Nv.muted,
                            side: const BorderSide(color: Nv.line),
                          ),
                          icon: _isTesting
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.speed_rounded, size: 19),
                          label: const Text('Check'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _saveUrl,
                          icon: const Icon(Icons.check_rounded, size: 19),
                          label: const Text('Save'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            if (_testResult != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: _testSuccess == true ? Nv.brandSoft : Nv.dangerSoft,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Text(
                  _testResult!,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                    color: _testSuccess == true ? Nv.brandDark : Nv.danger,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
