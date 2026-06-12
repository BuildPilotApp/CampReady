package app.campready.mobile;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String FORCE_DARK_SCRIPT = """
        (function(){try{var r=document.documentElement;
        r.classList.add('dark');
        r.classList.remove('light');
        r.setAttribute('data-theme','dark');
        r.style.colorScheme='dark';
        if(document.body){document.body.style.colorScheme='dark';}
        }catch(e){}})();""";

    private static final int WEBVIEW_BACKGROUND = Color.parseColor("#09090b");
    private static final long[] THEME_SYNC_DELAYS_MS = {0, 50, 100, 250, 500, 1000, 2000};

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        super.onCreate(savedInstanceState);
        applyDarkSystemChrome();
        scheduleForcedDarkTheme();
    }

    @Override
    public void onStart() {
        super.onStart();
        scheduleForcedDarkTheme();
    }

    @Override
    public void onResume() {
        super.onResume();
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        applyDarkSystemChrome();
        scheduleForcedDarkTheme();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // OEM skins re-apply uiMode on rotation, fold, or system theme toggles.
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        applyDarkSystemChrome();
        scheduleForcedDarkTheme();
    }

    private void applyDarkSystemChrome() {
        Window window = getWindow();
        if (window != null) {
            window.setStatusBarColor(WEBVIEW_BACKGROUND);
            window.setNavigationBarColor(WEBVIEW_BACKGROUND);

            WindowCompat.setDecorFitsSystemWindows(window, true);
            var insets = WindowCompat.getInsetsController(window, window.getDecorView());
            insets.setAppearanceLightStatusBars(false);
            insets.setAppearanceLightNavigationBars(false);
        }
    }

    private void scheduleForcedDarkTheme() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }

        WebView webView = bridge.getWebView();
        configureWebViewForForcedDark(webView);

        for (long delay : THEME_SYNC_DELAYS_MS) {
            if (delay == 0) {
                webView.post(this::applyForcedDarkTheme);
            } else {
                webView.postDelayed(this::applyForcedDarkTheme, delay);
            }
        }
    }

    private void configureWebViewForForcedDark(WebView webView) {
        webView.setBackgroundColor(WEBVIEW_BACKGROUND);

        WebSettings settings = webView.getSettings();

        // Stop WebView from auto-inverting or following system color scheme (API 29–34+).
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false);
        }
    }

    private void applyForcedDarkTheme() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }

        WebView webView = bridge.getWebView();
        configureWebViewForForcedDark(webView);
        webView.evaluateJavascript(FORCE_DARK_SCRIPT, null);
    }
}
