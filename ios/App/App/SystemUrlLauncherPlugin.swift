import Capacitor
import Foundation

@objc(SystemUrlLauncherPlugin)
public class SystemUrlLauncherPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SystemUrlLauncherPlugin"
    public let jsName = "SystemUrlLauncher"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "openUrl", returnType: CAPPluginReturnPromise),
    ]

    @objc func openUrl(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("URL is required")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("Unable to open URL")
                }
            }
        }
    }
}
