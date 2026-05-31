import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class DigiLockerWebViewScreen extends StatefulWidget {
  final String authorizationUrl;
  final String redirectUrl;

  const DigiLockerWebViewScreen(
      {super.key, required this.authorizationUrl, required this.redirectUrl});

  @override
  State<DigiLockerWebViewScreen> createState() =>
      _DigiLockerWebViewScreenState();
}

class _DigiLockerWebViewScreenState extends State<DigiLockerWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            // When DigiLocker is done, it redirects to the URL specified in the backend.
            // We intercept this redirect to know it's finished.
            if (request.url.startsWith(widget.redirectUrl)) {
              // Pop the screen and return 'true' to signal success.
              Navigator.pop(context, true);
              return NavigationDecision.prevent; // Stop the navigation.
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authorizationUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('DigiLocker Authentication'),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
