export function getAssetNameByPolicyId(
  amounts: { unit: string; quantity: string }[],
  policyId: string
): string | null {
  const policyIdLength = 56; // Assuming the policyId is always 56 characters

  for (const { unit } of amounts) {
    const currentPolicyId = unit.slice(0, policyIdLength);
    const assetName = unit.slice(policyIdLength);

    if (currentPolicyId === policyId) {
      return assetName;
    }
  }

  return null;
}
