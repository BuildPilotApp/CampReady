package com.buildpilotapps.campready;

import android.app.Activity;
import androidx.annotation.NonNull;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "CampReadyBilling")
public class CampReadyBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String DEFAULT_PRODUCT_ID = "campready_pro_lifetime";

    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private boolean billingReady = false;

    @Override
    public void load() {
        billingClient =
            BillingClient
                .newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(
                    PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
                )
                .build();

        billingClient.startConnection(
            new BillingClientStateListener() {
                @Override
                public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                    billingReady =
                        billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK;
                }

                @Override
                public void onBillingServiceDisconnected() {
                    billingReady = false;
                }
            }
        );
    }

    @PluginMethod
    public void purchaseProduct(PluginCall call) {
        String productId = call.getString("productId", DEFAULT_PRODUCT_ID);
        if (productId == null || productId.isBlank()) {
            call.reject("productId is required");
            return;
        }

        if (pendingPurchaseCall != null) {
            call.reject("A purchase is already in progress");
            return;
        }

        pendingPurchaseCall = call;
        call.setKeepAlive(true);

        ensureBillingReady(
            ready -> {
                if (!ready) {
                    rejectPendingPurchase("Google Play Billing is not available");
                    return;
                }

                List<QueryProductDetailsParams.Product> products = new ArrayList<>();
                products.add(
                    QueryProductDetailsParams.Product
                        .newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()
                );

                QueryProductDetailsParams params = QueryProductDetailsParams
                    .newBuilder()
                    .setProductList(products)
                    .build();

                billingClient.queryProductDetailsAsync(
                    params,
                    (billingResult, productDetailsList) -> {
                        if (
                            billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK ||
                            productDetailsList == null ||
                            productDetailsList.isEmpty()
                        ) {
                            rejectPendingPurchase("Product is not available for purchase");
                            return;
                        }

                        ProductDetails productDetails = productDetailsList.get(0);
                        Activity activity = getActivity();
                        if (activity == null) {
                            rejectPendingPurchase("Activity is not available");
                            return;
                        }

                        BillingFlowParams.ProductDetailsParams productDetailsParams = BillingFlowParams.ProductDetailsParams
                            .newBuilder()
                            .setProductDetails(productDetails)
                            .build();

                        BillingFlowParams flowParams = BillingFlowParams
                            .newBuilder()
                            .setProductDetailsParamsList(
                                Collections.singletonList(productDetailsParams)
                            )
                            .build();

                        BillingResult launchResult = billingClient.launchBillingFlow(
                            activity,
                            flowParams
                        );
                        if (
                            launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK
                        ) {
                            rejectPendingPurchase("Could not start Google Play purchase");
                        }
                    }
                );
            }
        );
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        ensureBillingReady(
            ready -> {
                if (!ready) {
                    call.reject("Google Play Billing is not available");
                    return;
                }

                QueryPurchasesParams params = QueryPurchasesParams
                    .newBuilder()
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build();

                billingClient.queryPurchasesAsync(
                    params,
                    (billingResult, purchases) -> {
                        if (
                            billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK
                        ) {
                            call.reject("Could not restore purchases");
                            return;
                        }

                        boolean owned = false;
                        if (purchases != null) {
                            for (Purchase purchase : purchases) {
                                if (isOwnedProPurchase(purchase)) {
                                    owned = true;
                                    acknowledgeIfNeeded(purchase);
                                }
                            }
                        }

                        JSObject result = new JSObject();
                        result.put("owned", owned);
                        call.resolve(result);
                    }
                );
            }
        );
    }

    @Override
    public void onPurchasesUpdated(
        @NonNull BillingResult billingResult,
        List<Purchase> purchases
    ) {
        if (pendingPurchaseCall == null) {
            if (purchases != null) {
                for (Purchase purchase : purchases) {
                    if (isOwnedProPurchase(purchase)) {
                        acknowledgeIfNeeded(purchase);
                    }
                }
            }
            return;
        }

        int responseCode = billingResult.getResponseCode();
        if (responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (isOwnedProPurchase(purchase)) {
                    acknowledgeIfNeeded(purchase);
                    resolvePendingPurchase(true, false, null);
                    return;
                }
            }
            rejectPendingPurchase("Purchase was not completed");
            return;
        }

        if (responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            resolvePendingPurchase(false, true, null);
            return;
        }

        rejectPendingPurchase("Purchase failed");
    }

    private boolean isOwnedProPurchase(Purchase purchase) {
        return (
            purchase.getProducts().contains(DEFAULT_PRODUCT_ID) &&
            purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED
        );
    }

    private void acknowledgeIfNeeded(Purchase purchase) {
        if (!purchase.isAcknowledged()) {
            AcknowledgePurchaseParams params = AcknowledgePurchaseParams
                .newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();
            billingClient.acknowledgePurchase(params, billingResult -> {});
        }
    }

    private void resolvePendingPurchase(boolean success, boolean cancelled, String error) {
        if (pendingPurchaseCall == null) {
            return;
        }

        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;

        JSObject result = new JSObject();
        result.put("success", success);
        result.put("cancelled", cancelled);
        if (error != null) {
            result.put("error", error);
        }
        call.resolve(result);
    }

    private void rejectPendingPurchase(String message) {
        if (pendingPurchaseCall == null) {
            return;
        }

        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;
        call.reject(message);
    }

    private interface BillingReadyCallback {
        void onReady(boolean ready);
    }

    private void ensureBillingReady(BillingReadyCallback callback) {
        if (billingClient == null) {
            callback.onReady(false);
            return;
        }

        if (billingReady) {
            callback.onReady(true);
            return;
        }

        billingClient.startConnection(
            new BillingClientStateListener() {
                @Override
                public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                    billingReady =
                        billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK;
                    callback.onReady(billingReady);
                }

                @Override
                public void onBillingServiceDisconnected() {
                    billingReady = false;
                    callback.onReady(false);
                }
            }
        );
    }
}
