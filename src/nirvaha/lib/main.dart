import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/scan_provider.dart';
import 'providers/bin_provider.dart';
import 'screens/session_gate.dart';
import 'services/api_service.dart';
import 'widgets/ui_kit.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Screens now open with a light wash under the status bar, so the clock and
  // battery must be drawn dark or they disappear into it.
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ScanProvider()),
        ChangeNotifierProvider(
          create: (_) => BinProvider(api: ApiService()),
        ),
      ],
      child: const NirvahaApp(),
    ),
  );
}

class NirvahaApp extends StatelessWidget {
  const NirvahaApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Material 3 Eco-Friendly Color Palette
    const ecoGreenPrimary = Color(0xFF059669);
    const ecoGreenLight = Color(0xFFD1FAE5);
    const amberWarning = Color(0xFFD97706);

    return MaterialApp(
      title: 'Nirvaha - AI Plastic Recycling',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'PlusJakartaSans',
        colorScheme: ColorScheme.fromSeed(
          seedColor: ecoGreenPrimary,
          primary: ecoGreenPrimary,
          primaryContainer: ecoGreenLight,
          secondary: amberWarning,
          brightness: Brightness.light,
          surface: Colors.white,
        ),
        // A near-white ground makes the white cards read as raised surfaces
        // rather than merging into the page.
        scaffoldBackgroundColor: Nv.canvas,

        // Tighter tracking on headings; comfortable line height on body text.
        // The contrast between the two is what makes the layout feel designed
        // rather than merely spaced out.
        textTheme: const TextTheme(
          displaySmall: TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: -1.2,
            height: 1.1,
            color: Nv.ink,
          ),
          headlineMedium: TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: -1.0,
            height: 1.15,
            color: Nv.ink,
          ),
          headlineSmall: TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: -0.6,
            color: Nv.ink,
          ),
          titleLarge: TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: -0.4,
            color: Nv.ink,
          ),
          titleMedium: TextStyle(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
            color: Nv.ink,
          ),
          bodyLarge: TextStyle(height: 1.5, color: Nv.ink),
          bodyMedium: TextStyle(height: 1.5, color: Nv.muted),
          bodySmall: TextStyle(height: 1.45, color: Nv.faint),
          labelLarge: TextStyle(fontWeight: FontWeight.w700, letterSpacing: -0.1),
        ),

        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          foregroundColor: Nv.ink,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.dark,
            statusBarBrightness: Brightness.light,
          ),
          titleTextStyle: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
            color: Nv.ink,
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          color: Colors.white,
        ),
        dividerTheme: const DividerThemeData(color: Nv.line, thickness: 1),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: Colors.white,
          indicatorColor: Nv.brandSoft,
          elevation: 0,
          height: 70,
          labelTextStyle: WidgetStateProperty.resolveWith(
            (states) => TextStyle(
              fontSize: 11.5,
              fontWeight:
                  states.contains(WidgetState.selected)
                      ? FontWeight.w700
                      : FontWeight.w500,
              color: states.contains(WidgetState.selected)
                  ? Nv.brandDark
                  : Nv.muted,
            ),
          ),
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          insetPadding: const EdgeInsets.fromLTRB(16, 5, 16, 16),
          contentTextStyle: const TextStyle(
            fontSize: 13.5,
            height: 1.4,
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: Nv.brand,
            foregroundColor: Colors.white,
            minimumSize: const Size(0, 52),
            textStyle: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(0, 52),
            textStyle: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ),
      home: const SessionGate(),
    );
  }
}
