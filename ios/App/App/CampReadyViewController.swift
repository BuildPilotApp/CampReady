import Capacitor
import UIKit

class CampReadyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SystemUrlLauncherPlugin())
    }
}
