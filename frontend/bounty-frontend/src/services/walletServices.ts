import {
  applyParamsToScript,
  IWallet,
  mTuple,
  resolveScriptHash,
  stringToHex,
} from "@meshsdk/core";
import blueprint from "../../../../aiken-workspace/plutus.json";

export class UserWalletService {
  wallet: IWallet;
  idMintingPolicyId: string;

  findIdtoken = async (): Promise<{ hasIdToken: boolean }> => {
    const userAsset = await this.wallet.getBalance();

    const hasIdToken = userAsset.some(
      (asset) => asset.unit.slice(0, 56) === this.idMintingPolicyId
    );

    return { hasIdToken };
  };

  constructor(wallet: IWallet) {
    this.wallet = wallet;
    const idMintingScriptCbor = applyParamsToScript(
      blueprint.validators[5]!.compiledCode,
      [
        stringToHex(`${process.env.NEXT_PUBLIC_COLLECTION_NAME!}`),
        mTuple(
          process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
          process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
        ),
        process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_POLICY_ID!,
      ],
      "Mesh"
    );
    this.idMintingPolicyId = resolveScriptHash(idMintingScriptCbor, "V3");
  }
}
