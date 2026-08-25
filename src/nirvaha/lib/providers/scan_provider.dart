import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/scan_result.dart';
import '../services/api_service.dart';

class ScanProvider extends ChangeNotifier {
  static const String _prefKeyBackendUrl = 'nirvaha_backend_url';

  static const String _prefKeyToken = 'nirvaha_auth_token';
  static const String _prefKeyUserId = 'nirvaha_user_id';
  static const String _prefKeyName = 'nirvaha_user_name';
  static const String _prefKeyEmail = 'nirvaha_user_email';

  late ApiService _apiService;
  String _backendUrl = ApiService.defaultBaseUrl;
  String? _authToken;
  String _userId = '';
  String _userName = '';
  String _userEmail = '';

  ScanResult? _currentResult;
  bool _isScanning = false;
  String _scanStatus = 'Looking at your photo...';
  String? _errorMessage;

  // Real scans history (no invented baseline)
  final List<ScanResult> _history = [];

  // Connection health status
  bool? _isConnected;
  int? _lastLatencyMs;
  bool _isCheckingHealth = false;

  ScanProvider() {
    _apiService = ApiService(baseUrl: _backendUrl, authToken: _authToken);
    _loadPersistedUrl();
  }

  // Getters
  ScanResult? get currentResult => _currentResult;
  bool get isScanning => _isScanning;
  String get scanStatus => _scanStatus;
  String? get errorMessage => _errorMessage;
  List<ScanResult> get history => List.unmodifiable(_history);
  String get backendUrl => _backendUrl;
  bool? get isConnected => _isConnected;
  int? get lastLatencyMs => _lastLatencyMs;
  bool get isCheckingHealth => _isCheckingHealth;
  bool get isLoggedIn => _authToken != null && _authToken!.isNotEmpty;

  /// Exposed so the bin can be pointed at the same backend and signed-in user.
  ApiService get api => _apiService;
  String get userId => _userId;

  /// Signed-in user's name. Falls back to the email prefix, then a neutral
  /// label — never a hardcoded person.
  String get userName {
    if (_userName.trim().isNotEmpty) return _userName.trim();
    if (_userEmail.contains('@')) return _userEmail.split('@').first;
    return 'there';
  }

  String get userEmail => _userEmail;

  /// Restores a saved session on cold start so the user is not asked to log
  /// in every time they open the app.
  ///
  /// The token is verified against the server rather than trusted blindly — it
  /// may have expired, or been revoked by a logout on another device, and
  /// silently showing a signed-in shell that 401s on every call is worse than
  /// asking for a password.
  Future<bool> restoreSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_prefKeyToken);
      if (token == null || token.isEmpty) return false;

      // Use the persisted URL if one was saved, so the check hits the right host.
      final savedUrl = prefs.getString(_prefKeyBackendUrl);
      if (savedUrl != null && savedUrl.trim().isNotEmpty) {
        _backendUrl = savedUrl.trim();
      }

      _authToken = token;
      _userId = prefs.getString(_prefKeyUserId) ?? '';
      _userName = prefs.getString(_prefKeyName) ?? '';
      _userEmail = prefs.getString(_prefKeyEmail) ?? '';
      _apiService = ApiService(baseUrl: _backendUrl, authToken: _authToken);

      final me = await _apiService.getMe();
      if (me['id'] == null) throw Exception('no user');
      _userId = me['id'].toString();
      _userName = (me['displayName'] ?? _userName).toString();
      _userEmail = (me['email'] ?? _userEmail).toString();

      notifyListeners();
      await refreshHistory();
      return true;
    } catch (_) {
      // Expired, revoked, or the backend is unreachable — start clean.
      await logout();
      return false;
    }
  }

  /// Authenticate against the backend and keep the JWT for later calls.
  /// Throws on failure — callers must surface the error, never proceed.
  Future<void> login(String email, String password) async {
    final res = await _apiService.login(email, password);
    final token = res['token'] as String;
    _authToken = token;
    _userId = (res['id'] ?? '').toString();
    _userName = (res['displayName'] ?? '').toString();
    _userEmail = (res['email'] ?? email.trim()).toString();
    _apiService = ApiService(baseUrl: _backendUrl, authToken: _authToken);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKeyToken, token);
      await prefs.setString(_prefKeyUserId, _userId);
      await prefs.setString(_prefKeyName, _userName);
      await prefs.setString(_prefKeyEmail, _userEmail);
    } catch (_) {
      // Persistence is a convenience; a failed write must not block login.
    }
    notifyListeners();
    await refreshHistory();
  }

  /// Fixed-OTP path. Same token contract as [login].
  Future<void> verifyOtp(String email, String otp) async {
    final token = await _apiService.verifyOtp(email, otp);
    _authToken = token;
    _apiService = ApiService(baseUrl: _backendUrl, authToken: _authToken);
    notifyListeners();
    await refreshHistory();
  }

  Future<void> logout() async {
    _authToken = null;
    _userId = '';
    _userName = '';
    _userEmail = '';
    _history.clear();
    _apiService = ApiService(baseUrl: _backendUrl, authToken: null);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefKeyToken);
      await prefs.remove(_prefKeyUserId);
      await prefs.remove(_prefKeyName);
      await prefs.remove(_prefKeyEmail);
    } catch (_) {}
    notifyListeners();
  }

  /// Pull server-side history so the list survives a reinstall.
  Future<void> refreshHistory() async {
    try {
      final rows = await _apiService.fetchScans();
      _history
        ..clear()
        ..addAll(rows);
      notifyListeners();
    } catch (_) {
      // Offline or unauthenticated — keep whatever is already on screen.
    }
  }

  /// Total recyclable weight in kilograms calculated strictly from real scans
  double get totalWeightRecycledKg {
    final totalGrams = _history
        .where((item) => item.isHappyPath)
        .fold<num>(0, (sum, item) => sum + (item.estimatedWeightGrams * item.quantity));
    return totalGrams / 1000.0;
  }

  /// Total items scanned strictly from real scans
  int get totalItemsCount => _history.length;

  /// Recyclable items count
  int get recyclableCount => _history.where((item) => item.isHappyPath).length;

  /// Uncertain items count
  int get uncertainCount => _history.where((item) => item.isUncertain).length;

  /// Mean confidence score of all scans
  double get meanConfidence {
    if (_history.isEmpty) return 0.0;
    final total = _history.fold<double>(0.0, (sum, item) => sum + item.confidenceScore);
    return total / _history.length;
  }

  /// Load persisted backend URL on app startup
  Future<void> _loadPersistedUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUrl = prefs.getString(_prefKeyBackendUrl);
      if (savedUrl != null && savedUrl.trim().isNotEmpty) {
        _backendUrl = savedUrl.trim();
        _apiService = ApiService(baseUrl: _backendUrl, authToken: _authToken);
        notifyListeners();
      }
      // Check initial backend health
      await checkBackendHealth();
    } catch (_) {
      // Ignored for testing environments
    }
  }

  /// Update backend tunnel URL and persist in SharedPreferences
  Future<void> setBackendUrl(String url) async {
    final cleanUrl = url.trim();
    if (cleanUrl.isNotEmpty) {
      _backendUrl = cleanUrl;
      _apiService = ApiService(baseUrl: _backendUrl, authToken: _authToken);
      notifyListeners();

      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_prefKeyBackendUrl, _backendUrl);
      } catch (_) {}

      await checkBackendHealth();
    }
  }

  /// Ping the backend /api/health endpoint
  Future<int?> checkBackendHealth() async {
    _isCheckingHealth = true;
    notifyListeners();

    try {
      final latency = await _apiService.testHealth();
      _isConnected = true;
      _lastLatencyMs = latency;
      _isCheckingHealth = false;
      notifyListeners();
      return latency;
    } catch (e) {
      _isConnected = false;
      _lastLatencyMs = null;
      _isCheckingHealth = false;
      notifyListeners();
      return null;
    }
  }

  void clearCurrentResult() {
    _currentResult = null;
    _errorMessage = null;
    notifyListeners();
  }

  /// Trigger scanning process with image file
  Future<ScanResult?> scanImage(XFile imageFile) async {
    _isScanning = true;
    _errorMessage = null;
    _scanStatus = 'Looking at your photo...';
    notifyListeners();

    try {
      final result = await _apiService.scanImage(imageFile);
      _currentResult = result;
      _history.insert(0, result);
      _isConnected = true;
      _isScanning = false;
      notifyListeners();
      return result;
    } catch (e) {
      _isScanning = false;
      _errorMessage = e is ApiException ? e.message : e.toString();
      _isConnected = false;
      notifyListeners();
      return null;
    }
  }

  /// Add batch result or manual test record
  void addResult(ScanResult result) {
    _currentResult = result;
    _history.insert(0, result);
    notifyListeners();
  }

  /// Clear history
  void clearHistory() {
    _history.clear();
    _currentResult = null;
    notifyListeners();
  }
}
