import 'package:flutter/foundation.dart';
import '../models/scan_result.dart';
import '../services/api_service.dart';

/// Tracks the user's Digital Bin — the running tally of sorted plastic they
/// have set aside. Pickup stays locked until the bin is heavy enough to be
/// worth a vendor's trip, which is what makes household collection viable.
class BinProvider extends ChangeNotifier {
  /// A trip is only worth driving above this much sorted plastic.
  static const int minimumPickupThresholdGrams = 2000;

  /// Neighbourhood this user belongs to. Hardcoded for the pilot.
  static const String defaultZone = 'RS Puram';

  ApiService _api;
  String _userId;
  String _zone = defaultZone;

  int _totalBinWeightGrams = 0;
  int _itemCount = 0;
  Map<String, double> _breakdown = {};
  String _status = 'FILLING';
  double _scheduledKg = 0;
  DateTime? _scheduledFor;
  DateTime? _requestedAt;
  DateTime? _lastCollectedAt;
  List<Map<String, dynamic>> _pickupHistory = [];
  Set<String> _binnedScanIds = {};
  bool _isRequesting = false;
  double _lifetimeKg = 0;
  int _pickupCount = 0;
  String? _currentMilestone;
  String? _nextMilestone;
  double _nextMilestoneKg = 0;
  double _milestoneProgress = 0;
  List<Map<String, dynamic>> _badges = [];

  bool _isAdding = false;
  bool _isLoading = false;
  String? _errorMessage;

  BinProvider({required ApiService api, String userId = 'demo_user'})
      // ignore: prefer_initializing_formals
      : _api = api,
        // ignore: prefer_initializing_formals
        _userId = userId;

  int get totalBinWeightGrams => _totalBinWeightGrams;
  double get totalBinWeightKg => _totalBinWeightGrams / 1000.0;
  double get thresholdKg => minimumPickupThresholdGrams / 1000.0;
  int get itemCount => _itemCount;
  Map<String, double> get breakdown => Map.unmodifiable(_breakdown);
  bool get isAdding => _isAdding;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get zone => _zone;

  /// 0.0 → 1.0, clamped so the bar never overflows past full.
  double get progress =>
      (_totalBinWeightGrams / minimumPickupThresholdGrams).clamp(0.0, 1.0);

  bool get isUnlocked => _totalBinWeightGrams >= minimumPickupThresholdGrams;

  /// FILLING | READY | REQUESTED | SCHEDULED | COLLECTED — what the user
  /// should be told.
  String get status => _status;
  bool get isRequested => _status == 'REQUESTED';
  bool get isScheduled => _status == 'SCHEDULED';
  bool get isCollected => _status == 'COLLECTED';
  double get scheduledKg => _scheduledKg;
  DateTime? get scheduledFor => _scheduledFor;
  DateTime? get requestedAt => _requestedAt;
  DateTime? get lastCollectedAt => _lastCollectedAt;
  bool get isRequesting => _isRequesting;

  /// Past collections, newest first. One entry per trip a vendor made.
  List<Map<String, dynamic>> get pickupHistory =>
      List.unmodifiable(_pickupHistory);

  /// Whether this scan has already been put in the bin, at any point.
  ///
  /// A scan with no server id (constructed locally, or an old cached row)
  /// cannot be checked, so it stays addable rather than being wrongly blocked.
  bool containsScan(String scanId) =>
      scanId.isNotEmpty && _binnedScanIds.contains(scanId);

  /// True once the bin has been asked for and is out of the user's hands —
  /// either waiting on a vendor or already claimed by one.
  bool get isAwaitingCollection => isRequested || isScheduled;

  double get lifetimeKg => _lifetimeKg;
  int get pickups => _pickupCount;
  String? get currentMilestone => _currentMilestone;
  String? get nextMilestone => _nextMilestone;
  double get nextMilestoneKg => _nextMilestoneKg;
  double get milestoneProgress => _milestoneProgress;
  List<Map<String, dynamic>> get badges => List.unmodifiable(_badges);

  /// One line describing where this bin stands, for the status chip.
  String get statusLabel {
    switch (_status) {
      case 'REQUESTED':
        return 'Waiting for pickup';
      case 'SCHEDULED':
        return 'Vendor on the way';
      case 'COLLECTED':
        return 'Collected — thank you';
      case 'READY':
        return 'Ready to collect';
      default:
        return 'Filling up';
    }
  }

  /// The sentence under the status chip. Says what happens next rather than
  /// restating the status, so the two lines are never redundant.
  String get statusDetail {
    switch (_status) {
      case 'REQUESTED':
        return 'A vendor will claim your zone and collect from your door.';
      case 'SCHEDULED':
        return _scheduledFor == null
            ? 'A vendor has claimed your zone.'
            : 'A vendor has claimed your zone and is collecting soon.';
      case 'COLLECTED':
        return 'Your bin is empty and the weight is counted in your total.';
      case 'READY':
        return 'Your bin is heavy enough. Ask for a pickup when you are ready.';
      default:
        return 'Add ${(remainingGrams / 1000).toStringAsFixed(2)} kg more to '
            'unlock pickup.';
    }
  }

  int get remainingGrams =>
      (minimumPickupThresholdGrams - _totalBinWeightGrams)
          .clamp(0, minimumPickupThresholdGrams);

  /// Keeps the provider pointed at the right backend and user after login.
  void updateContext({ApiService? api, String? userId, String? zone}) {
    if (api != null) _api = api;
    if (userId != null && userId.isNotEmpty) _userId = userId;
    if (zone != null && zone.isNotEmpty) _zone = zone;
  }

  Future<void> refresh() async {
    _isLoading = true;
    notifyListeners();
    try {
      final s = await _api.getBinSummary(_userId);
      _applySummary(s);
      _errorMessage = null;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    // Collections are what the History tab is for; fetch them alongside so the
    // two views can never disagree about whether a pickup happened.
    await refreshPickups();
  }

  /// Past collections for this user, plus which scans are already binned.
  Future<void> refreshPickups() async {
    try {
      _pickupHistory = await _api.fetchPickups(_userId);
      notifyListeners();
    } catch (_) {
      // Offline — keep whatever is already on screen rather than blanking it.
    }
    try {
      _binnedScanIds = await _api.fetchBinnedScanIds(_userId);
      notifyListeners();
    } catch (_) {
      // Same: a stale set only risks offering an add the server will refuse.
    }
  }

  /// Ask a vendor to collect this bin.
  ///
  /// Returns the server's message either way. The old button called [refresh]
  /// and showed a success toast regardless, so a user could "schedule" a
  /// pickup that no vendor would ever see.
  Future<({bool ok, String message})> requestPickup() async {
    _isRequesting = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final res = await _api.requestPickup(_userId);
      final summary = res['summary'];
      if (summary is Map<String, dynamic>) _applySummary(summary);

      final ok = res['ok'] == true;
      final message = (res['message'] ?? '').toString();
      if (!ok) _errorMessage = message;
      return (ok: ok, message: message);
    } catch (e) {
      final message = e
          .toString()
          .replaceFirst('ApiException: ', '')
          .replaceFirst('Exception: ', '');
      _errorMessage = message;
      return (ok: false, message: message);
    } finally {
      _isRequesting = false;
      notifyListeners();
    }
  }

  /// Adds a classified item to the bin.
  ///
  /// Returns whether the weight actually moved, plus whether the server
  /// refused it as a duplicate — the caller must not celebrate a re-add.
  Future<({bool ok, bool duplicate, String? message})> addToBin(
    ScanResult result,
  ) async {
    // Cheap client-side guard so an obviously-binned scan never round-trips.
    if (containsScan(result.id)) {
      return (
        ok: false,
        duplicate: true,
        message: 'This item is already in your bin.',
      );
    }

    _isAdding = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final s = await _api.addToDigitalBin(
        result: result,
        zone: _zone,
        userId: _userId,
      );
      final duplicate = s['duplicate'] == true;
      _applySummary(s);
      if (result.id.isNotEmpty) _binnedScanIds.add(result.id);
      return (
        ok: !duplicate,
        duplicate: duplicate,
        message: s['message']?.toString(),
      );
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('ApiException: ', '');
      return (ok: false, duplicate: false, message: _errorMessage);
    } finally {
      _isAdding = false;
      notifyListeners();
    }
  }

  void _applySummary(Map<String, dynamic> s) {
    if (s.isEmpty) return;
    _totalBinWeightGrams = (s['totalWeightGrams'] as num?)?.round() ?? 0;
    _itemCount = (s['itemCount'] as num?)?.toInt() ?? 0;
    _status = (s['status'] ?? 'FILLING').toString();

    final b = s['breakdown'];
    if (b is Map) {
      _breakdown = b.map(
        (k, v) => MapEntry(k.toString(), ((v as num?) ?? 0).toDouble()),
      );
    }

    final sch = s['scheduled'];
    if (sch is Map) {
      _scheduledKg = ((sch['weightKg'] as num?) ?? 0).toDouble();
      final f = sch['scheduledFor'];
      _scheduledFor = f == null ? null : DateTime.tryParse(f.toString());
    }

    final req = s['requestedAt'];
    _requestedAt = req == null ? null : DateTime.tryParse(req.toString());
    final col = s['lastCollectedAt'];
    _lastCollectedAt = col == null ? null : DateTime.tryParse(col.toString());

    final lt = s['lifetime'];
    if (lt is Map) {
      _lifetimeKg = ((lt['collectedKg'] as num?) ?? 0).toDouble();
      _pickupCount = ((lt['pickups'] as num?) ?? 0).toInt();
      _milestoneProgress =
          ((lt['nextMilestoneProgress'] as num?) ?? 0).toDouble();
      final cur = lt['currentMilestone'];
      _currentMilestone = cur is Map ? cur['label']?.toString() : null;
      final nxt = lt['nextMilestone'];
      _nextMilestone = nxt is Map ? nxt['label']?.toString() : null;
      _nextMilestoneKg =
          nxt is Map ? ((nxt['kg'] as num?) ?? 0).toDouble() : 0;
      final ms = lt['milestones'];
      if (ms is List) {
        _badges = ms.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
      }
    }
  }

  void reset() {
    _totalBinWeightGrams = 0;
    _itemCount = 0;
    _breakdown = {};
    _errorMessage = null;
    _status = 'FILLING';
    _requestedAt = null;
    _lastCollectedAt = null;
    _scheduledKg = 0;
    _scheduledFor = null;
    _pickupHistory = [];
    _binnedScanIds = {};
    _lifetimeKg = 0;
    _pickupCount = 0;
    _badges = [];
    _currentMilestone = null;
    _nextMilestone = null;
    _nextMilestoneKg = 0;
    _milestoneProgress = 0;
    notifyListeners();
  }
}
