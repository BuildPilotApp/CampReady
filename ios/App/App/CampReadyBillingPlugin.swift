import Capacitor
import Foundation
import StoreKit

@objc(CampReadyBillingPlugin)
public class CampReadyBillingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CampReadyBillingPlugin"
    public let jsName = "CampReadyBilling"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "purchaseProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
    ]

    private static let defaultProductId = "campready_pro_lifetime"
    private var purchaseInFlight = false

    @objc func purchaseProduct(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? Self.defaultProductId
        guard !productId.isEmpty else {
            call.reject("productId is required")
            return
        }

        guard !purchaseInFlight else {
            call.reject("A purchase is already in progress")
            return
        }

        purchaseInFlight = true

        Task { [weak self] in
            guard let self else { return }
            defer { self.purchaseInFlight = false }

            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.resolve([
                        "success": false,
                        "cancelled": false,
                        "error": "Product is not available for purchase",
                    ])
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    let transaction = try self.checkVerified(verification)
                    await transaction.finish()
                    call.resolve([
                        "success": true,
                        "cancelled": false,
                    ])
                case .userCancelled:
                    call.resolve([
                        "success": false,
                        "cancelled": true,
                    ])
                case .pending:
                    call.resolve([
                        "success": false,
                        "cancelled": false,
                        "error": "Purchase is pending approval",
                    ])
                @unknown default:
                    call.resolve([
                        "success": false,
                        "cancelled": false,
                        "error": "Purchase failed",
                    ])
                }
            } catch {
                call.resolve([
                    "success": false,
                    "cancelled": false,
                    "error": error.localizedDescription,
                ])
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
            } catch {
                // Continue to entitlement check; sync can fail offline.
            }

            var owned = false
            for await result in Transaction.currentEntitlements {
                do {
                    let transaction = try self.checkVerified(result)
                    if transaction.productID == Self.defaultProductId {
                        owned = true
                        await transaction.finish()
                    }
                } catch {
                    continue
                }
            }

            call.resolve(["owned": owned])
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }
}
