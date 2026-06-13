package com.buildpilotapps.campready;

import android.app.Application;
import androidx.appcompat.app.AppCompatDelegate;

/** Locks the entire app to dark mode before any activity or WebView is created. */
public class CampReadyApplication extends Application {
    @Override
    public void onCreate() {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        super.onCreate();
    }
}
