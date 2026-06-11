package app.campready.mobile;

import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        scheduleSystemThemeSync();
    }

    @Override
    public void onStart() {
        super.onStart();
        scheduleSystemThemeSync();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        scheduleSystemThemeSync();
    }

    private void scheduleSystemThemeSync() {
        if (bridge == null) {
            return;
        }

        WebView webView = bridge.getWebView();
        if (webView == null) {
            return;
        }

        Runnable sync = this::applySystemThemeClass;
        webView.post(sync);
        webView.postDelayed(sync, 100);
        webView.postDelayed(sync, 500);
    }

    private void applySystemThemeClass() {
        if (bridge == null) {
            return;
        }

        WebView webView = bridge.getWebView();
        if (webView == null) {
            return;
        }

        int nightMode =
            getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean isDark = nightMode == Configuration.UI_MODE_NIGHT_YES;
        String script =
            "document.documentElement.classList.toggle('dark', "
                + (isDark ? "true" : "false")
                + ");";

        webView.evaluateJavascript(script, null);
    }
}
