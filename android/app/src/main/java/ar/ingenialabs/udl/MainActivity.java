package ar.ingenialabs.udl;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Antes de super.onCreate(): evita Invalid resource ID 0x00000000 en Android 12+
        // y permite que el splash del sistema suelte el primer frame del WebView.
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
}
