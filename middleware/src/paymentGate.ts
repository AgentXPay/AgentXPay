import { Request, Response, NextFunction } from "express";
import { ethers } from "ethers";
import { PaymentGateConfig } from "./types";
import { PaymentVerifier } from "./verifier";
import { Facilitator } from "./facilitator";

const SUBSCRIPTION_MANAGER_ABI = [
  "function checkAccess(address user, uint256 serviceId) external view returns (bool)"
];

export function createPaymentGate(config: PaymentGateConfig) {
  const verifier = new PaymentVerifier(config.rpcUrl, config.cacheTtl);
  const facilitator = new Facilitator({
    serviceId: 0,
    priceWei: "0",
    token: "native",
    paymentAddress: config.paymentManagerAddress,
  });

  for (const route of config.routes) {
    facilitator.registerRoute(route);
  }

  const chainId = config.chainId || 10143;
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);

  // Create SubscriptionManager contract instance if address is provided
  const subscriptionManager = config.subscriptionManagerAddress
    ? new ethers.Contract(config.subscriptionManagerAddress, SUBSCRIPTION_MANAGER_ABI, provider)
    : null;

  return async function paymentGate(req: Request, res: Response, next: NextFunction) {
    const routeConfig = facilitator.getRouteConfig(req.method, req.path);
    if (!routeConfig) {
      return next();
    }

    // Check subscription access first
    const subscriberAddress = req.headers["x-subscription-address"] as string;
    const serviceId = req.headers["x-payment-serviceid"] as string;

    if (subscriberAddress && serviceId) {
      if (!subscriptionManager) {
        console.warn("[paymentGate] Subscription check skipped: SubscriptionManager not configured");
        return res.status(403).json({
          error: "Subscription Not Configured",
          message: "The service provider has not configured subscription verification. Please contact the provider or use pay-per-use.",
        });
      }

      try {
        const hasAccess = await subscriptionManager.checkAccess(
          subscriberAddress,
          BigInt(serviceId)
        );
        if (hasAccess) {
          (req as any).payment = {
            type: "subscription",
            subscriber: subscriberAddress,
            serviceId: serviceId,
          };
          return next();
        } else {
          // Subscription exists but not active or not found
          return res.status(403).json({
            error: "Subscription Inactive",
            message: `No active subscription found for address ${subscriberAddress} on service ${serviceId}. Your subscription may have expired.`,
          });
        }
      } catch (err) {
        console.warn("[paymentGate] Subscription check failed:", (err as Error).message);
        return res.status(500).json({
          error: "Subscription Verification Error",
          message: `Failed to verify subscription: ${(err as Error).message}`,
        });
      }
    }

    const txHash = req.headers["x-payment-txhash"] as string;

    if (!txHash) {
      res.status(402);
      res.setHeader("X-Payment-Address", config.paymentManagerAddress);
      res.setHeader("X-Payment-Amount", routeConfig.priceWei);
      res.setHeader("X-Payment-Token", routeConfig.token);
      res.setHeader("X-Payment-ServiceId", routeConfig.serviceId.toString());
      res.setHeader("X-Payment-ChainId", chainId.toString());
      return res.json({
        error: "Payment Required",
        message: "This endpoint requires payment. Send a transaction and include X-Payment-TxHash header.",
        payment: {
          address: config.paymentManagerAddress,
          amount: routeConfig.priceWei,
          token: routeConfig.token,
          serviceId: routeConfig.serviceId,
          chainId,
        },
      });
    }

    const result = await verifier.verifyPayment(
      txHash,
      config.paymentManagerAddress,
      BigInt(routeConfig.priceWei)
    );

    if (!result.valid) {
      return res.status(402).json({
        error: "Payment Verification Failed",
        message: result.error,
        txHash,
      });
    }

    (req as any).payment = {
      type: "payment",
      txHash: result.txHash,
      payer: result.payer,
      amount: result.amount?.toString(),
    };

    next();
  };
}
