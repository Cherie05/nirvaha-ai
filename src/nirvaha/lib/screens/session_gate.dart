import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scan_provider.dart';
import '../providers/bin_provider.dart';
import '../widgets/ui_kit.dart';
import 'login_screen.dart';
import 'main_layout.dart';

/// Decides, on cold start, whether the user still has a valid session.
///
/// Shown for a fraction of a second while the saved token is checked against
/// the server. Without this the app would ask for a password every launch even
/// though the JWT is good for a week.
class SessionGate extends StatefulWidget {
  const SessionGate({super.key});

  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  bool _checking = true;
  bool _signedIn = false;

  @override
  void initState() {
    super.initState();
    _restore();
  }

  Future<void> _restore() async {
    final scan = context.read<ScanProvider>();
    final ok = await scan.restoreSession();

    if (ok && mounted) {
      // Point the bin at the restored user before the dashboard reads it.
      final bin = context.read<BinProvider>();
      bin.updateContext(api: scan.api, userId: scan.userId);
      await bin.refresh();
    }

    if (!mounted) return;
    setState(() {
      _signedIn = ok;
      _checking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return Scaffold(
        backgroundColor: Nv.canvas,
        body: Container(
          decoration: const BoxDecoration(gradient: Nv.wash),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF0F5132), Color(0xFF06301B)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x4D0F5132),
                        blurRadius: 28,
                        offset: Offset(0, 12),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(21),
                  child: Image.asset(
                    'assets/images/logo_mark.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(
                      Icons.eco_rounded,
                      size: 44,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Nirvaha',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.8,
                    color: Nv.ink,
                  ),
                ),
                const SizedBox(height: 26),
                const SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    color: Nv.brand,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return _signedIn ? const MainLayout() : const LoginScreen();
  }
}
