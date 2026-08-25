import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' show MediaType;
import 'package:image_picker/image_picker.dart';
import '../models/scan_result.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => 'ApiException: $message (status: $statusCode)';
}

class ApiService {
  /// Base URL for the NestJS backend.
  ///
  /// Set at build time so no rebuild is needed when the ngrok URL rotates:
  ///   flutter run --dart-define=API_BASE_URL=https://xxxx.ngrok-free.dev
  ///
  /// Falls back to the Android emulator loopback (10.0.2.2 is the host machine
  /// as seen from the emulator; a real device over USB must use the LAN IP or
  /// the ngrok URL). A saved URL from the Settings screen overrides this.
  static const String defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Compile-time flag for explicit demo mode (never silent)
  static const bool isDemoMode = bool.fromEnvironment('DEMO_MODE', defaultValue: false);

  final String baseUrl;
  final String? authToken;

  /// Only set when a test injects one. Production code deliberately uses a
  /// fresh client per request — see [_newClient].
  final http.Client? _injectedClient;

  ApiService({
    String? baseUrl,
    this.authToken,
    http.Client? client,
  })  : baseUrl = (baseUrl != null && baseUrl.trim().isNotEmpty)
            ? (baseUrl.endsWith('/')
                ? baseUrl.substring(0, baseUrl.length - 1)
                : baseUrl)
            : defaultBaseUrl,
        _injectedClient = client;

  /// ngrok drops idle tunnel connections. A pooled keep-alive socket that
  /// worked a moment ago is often already dead, which surfaces as
  /// "Connection closed before full header was received". Using a fresh
  /// client per request avoids inheriting a dead socket.
  http.Client _newClient() => _injectedClient ?? http.Client();

  /// Headers including optional Authorization Bearer token and Ngrok bypass
  Map<String, String> _buildHeaders() {
    final headers = <String, String>{
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      // Do not let this socket linger in the pool for the next request.
      'Connection': 'close',
    };
    if (authToken != null && authToken!.trim().isNotEmpty) {
      headers['Authorization'] = 'Bearer ${authToken!.trim()}';
    }
    return headers;
  }

  /// ngrok closes idle tunnel connections, so a pooled keep-alive socket that
  /// worked for the last request is often already dead by the next one. That
  /// surfaces as "Connection closed before full header was received". Retrying
  /// once on a brand-new client fixes it; a real failure still throws.
  Future<http.Response> _postJson(String path, Map<String, dynamic> payload,
      {int attempt = 0}) async {
    final endpoint = Uri.parse('$baseUrl$path');
    final headers = {
      ..._buildHeaders(),
      'Content-Type': 'application/json',
      'Connection': 'close',
    };
    try {
      final c = _newClient();
      return await c
          .post(endpoint, headers: headers, body: json.encode(payload))
          .timeout(const Duration(seconds: 25));
    } on http.ClientException catch (_) {
      if (attempt >= 1) rethrow;
      await Future<void>.delayed(const Duration(milliseconds: 400));
      return _postJson(path, payload, attempt: attempt + 1);
    }
  }

  /// POST {url}/api/auth/login → token plus the signed-in user.
  /// Throws ApiException with the server's message on bad credentials.
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _postJson(
      '/api/auth/login',
      {'email': email.trim(), 'password': password},
    );

    final body = json.decode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final token = body['access_token'] as String?;
      if (token == null || token.isEmpty) {
        throw ApiException('Login succeeded but no token was returned');
      }
      final user = (body['user'] as Map<String, dynamic>?) ?? const {};
      return {
        'token': token,
        'id': (user['id'] ?? '').toString(),
        'displayName': (user['displayName'] ?? '').toString(),
        'email': (user['email'] ?? email.trim()).toString(),
      };
    }
    throw ApiException(
      (body['message'] ?? 'Login failed').toString(),
      res.statusCode,
    );
  }

  /// POST {url}/api/auth/verify-otp → returns the JWT access token.
  /// The backend uses a fixed demo OTP; there is no SMS provider.
  Future<String> verifyOtp(String email, String otp) async {
    final res = await _postJson(
      '/api/auth/verify-otp',
      {'email': email.trim(), 'otp': otp.trim()},
    );

    final body = json.decode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final token = body['access_token'] as String?;
      if (token == null || token.isEmpty) {
        throw ApiException('OTP accepted but no token was returned');
      }
      return token;
    }
    throw ApiException(
      (body['message'] ?? 'Invalid OTP').toString(),
      res.statusCode,
    );
  }

  /// POST {url}/api/bin/add → drops a classified item into the Digital Bin.
  /// Returns the updated bin summary so the progress bar can move immediately.
  Future<Map<String, dynamic>> addToDigitalBin({
    required ScanResult result,
    required String zone,
    required String userId,
  }) async {
    final res = await _postJson('/api/bin/add', {
      'userId': userId,
      'zone': zone,
      'materialType': result.materialType,
      'weightGrams': result.estimatedWeightGrams,
      // Lets the server reject a second add of the same photo.
      if (result.id.isNotEmpty) 'scanId': result.id,
    });

    final body = json.decode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final bin = body['bin'];
      return {
        if (bin is Map<String, dynamic>) ...bin,
        'duplicate': body['duplicate'] == true,
        if (body['message'] != null) 'message': body['message'],
      };
    }
    throw ApiException(
      (body['message'] ?? 'Could not add to bin').toString(),
      res.statusCode,
    );
  }

  /// GET {url}/api/bin/summary/{userId} → running tally + threshold state.
  Future<Map<String, dynamic>> getBinSummary(String userId) async {
    final endpoint = Uri.parse('$baseUrl/api/bin/summary/$userId');
    final res = await _newClient()
        .get(endpoint, headers: _buildHeaders())
        .timeout(const Duration(seconds: 20));

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final decoded = json.decode(utf8.decode(res.bodyBytes));
      return decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    }
    throw ApiException('Could not load your bin', res.statusCode);
  }

  /// POST {url}/api/bin/request-pickup → ask for the bin to be collected.
  ///
  /// Returns the whole envelope, not just the summary: the server decides
  /// whether the request was accepted (the bin may be under threshold) and the
  /// caller has to be able to tell the user which it was.
  Future<Map<String, dynamic>> requestPickup(String userId) async {
    final res = await _postJson('/api/bin/request-pickup', {'userId': userId});
    final body = json.decode(utf8.decode(res.bodyBytes));

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return body is Map<String, dynamic> ? body : <String, dynamic>{};
    }
    throw ApiException(
      (body is Map ? body['message'] : null)?.toString() ??
          'Could not request a pickup',
      res.statusCode,
    );
  }

  /// GET {url}/api/bin/pickups/{userId} → one entry per collection, newest
  /// first. This is the household's own history, not the vendor's.
  Future<List<Map<String, dynamic>>> fetchPickups(String userId) async {
    final endpoint = Uri.parse('$baseUrl/api/bin/pickups/$userId');
    final res = await _newClient()
        .get(endpoint, headers: _buildHeaders())
        .timeout(const Duration(seconds: 20));

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final decoded = json.decode(utf8.decode(res.bodyBytes));
      if (decoded is List) {
        return decoded.whereType<Map>().map(Map<String, dynamic>.from).toList();
      }
      return const [];
    }
    throw ApiException('Could not load your pickups', res.statusCode);
  }

  /// GET {url}/api/bin/scan-ids/{userId} → scans already added to the bin.
  Future<Set<String>> fetchBinnedScanIds(String userId) async {
    final endpoint = Uri.parse('$baseUrl/api/bin/scan-ids/$userId');
    final res = await _newClient()
        .get(endpoint, headers: _buildHeaders())
        .timeout(const Duration(seconds: 20));

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final decoded = json.decode(utf8.decode(res.bodyBytes));
      final ids = decoded is Map ? decoded['scanIds'] : null;
      if (ids is List) return ids.map((e) => e.toString()).toSet();
      return <String>{};
    }
    throw ApiException('Could not load your bin', res.statusCode);
  }

  /// GET {url}/api/auth/me → the signed-in user, or throws if the token is
  /// no longer valid (expired, or revoked by a logout elsewhere).
  Future<Map<String, dynamic>> getMe() async {
    final endpoint = Uri.parse('$baseUrl/api/auth/me');
    final res = await _newClient()
        .get(endpoint, headers: _buildHeaders())
        .timeout(const Duration(seconds: 15));

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final decoded = json.decode(utf8.decode(res.bodyBytes));
      return decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    }
    throw ApiException('Session expired', res.statusCode);
  }

  /// GET {url}/api/scans → the signed-in user's scan history, newest first.
  Future<List<ScanResult>> fetchScans({int limit = 20, int offset = 0}) async {
    final endpoint =
        Uri.parse('$baseUrl/api/scans?limit=$limit&offset=$offset');
    final res = await _newClient()
        .get(endpoint, headers: _buildHeaders())
        .timeout(const Duration(seconds: 20));

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final decoded = json.decode(utf8.decode(res.bodyBytes));
      if (decoded is! List) return const [];
      return decoded
          .whereType<Map<String, dynamic>>()
          .map(ScanResult.fromJson)
          .map((r) => r.copyWith(imageUrl: resolveImageUrl(r.imageUrl)))
          .toList();
    }
    throw ApiException('Could not load history', res.statusCode);
  }

  /// Ping GET {url}/api/health to measure roundtrip latency in ms
  Future<int> testHealth() async {
    final endpoint = Uri.parse('$baseUrl/api/health');
    final stopwatch = Stopwatch()..start();

    try {
      final response = await _newClient()
          .get(endpoint, headers: _buildHeaders())
          .timeout(const Duration(seconds: 10));
      stopwatch.stop();

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return stopwatch.elapsedMilliseconds;
      } else {
        throw ApiException(
          'Health check failed with status ${response.statusCode}: ${response.reasonPhrase}',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Cannot reach backend at $endpoint: $e');
    }
  }

  /// Turns a relative image path from the backend into an absolute URL the
  /// phone can fetch. Relative paths survive ngrok URL rotation.
  String? resolveImageUrl(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;
    final v = raw.trim();
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    return '$baseUrl${v.startsWith('/') ? v : '/$v'}';
  }

  /// Uploads an image file via multipart/form-data to POST {API_BASE_URL}/api/scan
  Future<ScanResult> scanImage(XFile imageFile) async {
    // If DEMO_MODE environment flag is explicitly enabled, return flagged mock
    if (isDemoMode) {
      return _buildExplicitDemoResult(imageFile.name);
    }

    final endpoint = Uri.parse('$baseUrl/api/scan');

    try {
      final request = http.MultipartRequest('POST', endpoint);

      // The part MUST carry an image Content-Type. Without it Dart sends
      // application/octet-stream and the backend's multer filter rejects the
      // upload with 400 "Only JPEG, PNG and WebP images are allowed".
      final name = imageFile.name.isNotEmpty ? imageFile.name : 'scan.jpg';
      final lower = name.toLowerCase();
      final MediaType partType = lower.endsWith('.png')
          ? MediaType('image', 'png')
          : lower.endsWith('.webp')
              ? MediaType('image', 'webp')
              : MediaType('image', 'jpeg');

      if (kIsWeb) {
        final bytes = await imageFile.readAsBytes();
        request.files.add(
          http.MultipartFile.fromBytes(
            'image',
            bytes,
            filename: name,
            contentType: partType,
          ),
        );
      } else {
        request.files.add(
          await http.MultipartFile.fromPath(
            'image',
            imageFile.path,
            filename: name,
            contentType: partType,
          ),
        );
      }

      // Add headers with optional Bearer JWT token
      request.headers.addAll(_buildHeaders());

      // 30-second timeout to accommodate vision models over mobile tunnels
      final streamedResponse = await _newClient()
          .send(request)
          .timeout(const Duration(seconds: 30));

      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final dynamic decoded = json.decode(utf8.decode(response.bodyBytes));
        if (decoded is Map<String, dynamic>) {
          final parsed = ScanResult.fromJson(decoded);
          // Attach the on-device photo so the result screen can render it with
          // no network call, and make any stored URL absolute for History.
          return parsed.copyWith(
            localImagePath: imageFile.path,
            imageUrl: resolveImageUrl(parsed.imageUrl),
          );
        } else {
          throw ApiException('Unexpected JSON response format from backend');
        }
      } else {
        throw ApiException(
          'Backend returned status ${response.statusCode}: ${response.body.isNotEmpty ? response.body : response.reasonPhrase}',
          response.statusCode,
        );
      }
    } catch (e) {
      debugPrint('Network error in scanImage: $e');
      if (e is ApiException) rethrow;
      throw ApiException('Failed to connect to backend scanner: $e');
    }
  }

  /// Only used when explicitly enabled via --dart-define=DEMO_MODE=true
  ScanResult _buildExplicitDemoResult(String fileName) {
    return ScanResult(
      isRecyclable: true,
      itemName: 'PET Water Bottle (Simulated)',
      materialType: 'PET 1',
      quantity: 1,
      estimatedWeightGrams: 25,
      recyclingInstructions: 'Rinse with water and crush to save space.',
      confidence: 'high',
      confidenceScore: 0.94,
      isMock: true,
      scannedAt: DateTime.now(),
    );
  }
}
