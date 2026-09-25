type DirectVendingReadiness = {
  enabled: boolean;
  approved: boolean;
  credentialsConfigured: boolean;
  message: string;
};

export function getDirectVendingReadiness(): DirectVendingReadiness {
  const approved = process.env.EDSA_VENDING_APPROVED === 'true';
  const credentialsConfigured = Boolean(
    process.env.EDSA_VENDING_API_URL &&
    process.env.EDSA_VENDING_CLIENT_ID &&
    process.env.EDSA_VENDING_CLIENT_SECRET &&
    process.env.EDSA_VENDING_MERCHANT_ID,
  );

  if (!approved) {
    return {
      enabled: false,
      approved: false,
      credentialsConfigured,
      message: 'Direct EDSA top-up is awaiting aggregator verification and approval.',
    };
  }

  if (!credentialsConfigured) {
    return {
      enabled: false,
      approved: true,
      credentialsConfigured: false,
      message: 'Direct EDSA top-up is awaiting secure vending gateway credentials.',
    };
  }

  return {
    // This remains false until the approved STS gateway adapter is implemented
    // and independently validated against EDSA's production sandbox.
    enabled: false,
    approved: true,
    credentialsConfigured: true,
    message: 'Direct EDSA vending is configured but awaiting final gateway validation.',
  };
}
