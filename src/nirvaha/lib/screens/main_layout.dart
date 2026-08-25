import 'package:flutter/material.dart';
import '../widgets/ui_kit.dart';
import 'dashboard_screen.dart';
import 'history_screen.dart';
import 'milestones_screen.dart';
import 'profile_screen.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;

  void _openTab(int index) {
    if (index == _currentIndex) return;
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    // Built here rather than in a const list so the dashboard can hand tab
    // changes back up to this state.
    final screens = [
      DashboardScreen(onOpenTab: _openTab),
      const MilestonesScreen(),
      const HistoryScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: Nv.canvas,
      extendBody: true,
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
          boxShadow: [
            BoxShadow(
              color: Color(0x140B1F14),
              blurRadius: 24,
              offset: Offset(0, -6),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: _openTab,
          backgroundColor: Colors.transparent,
          indicatorColor: Nv.brandSoft,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          height: 70,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.grid_view_rounded, color: Nv.faint),
              selectedIcon: Icon(Icons.grid_view_rounded, color: Nv.brandDeep),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.emoji_events_outlined, color: Nv.faint),
              selectedIcon:
                  Icon(Icons.emoji_events_rounded, color: Nv.brandDeep),
              label: 'Milestones',
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined, color: Nv.faint),
              selectedIcon:
                  Icon(Icons.receipt_long_rounded, color: Nv.brandDeep),
              label: 'History',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline_rounded, color: Nv.faint),
              selectedIcon: Icon(Icons.person_rounded, color: Nv.brandDeep),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
