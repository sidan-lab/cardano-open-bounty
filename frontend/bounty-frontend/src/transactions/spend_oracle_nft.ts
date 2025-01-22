import { OfflineEvaluator } from "@meshsdk/core-csl";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  stringToHex,
  deserializeAddress,
} from "@meshsdk/core";
import {
  getUtxoApiRoute,
  updateUtxoApiRoute,
} from "../pages/common/api_common";
import {
  getBountyBoardScriptHash,
  getBountyMintingPolicyId,
  getIdMintingPolicyId,
  getIdSpendingScriptHash,
  getOracleNFTAddress,
  getOracleNFTSpendingScriptCbor,
} from "./common";
import { actionUpdate, oracleNFTDatum, OracleNFTDatum } from "./types";

export const spendOracleNFT = async (wallet: IWallet) => {
  if (!wallet) {
    alert("Please connect your wallet");
    return;
  }
  if (!process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY) {
    alert("Please set up environment variables");
    return;
  }

  // Set up tx builder with blockfrost support
  const blockfrost: BlockfrostProvider = new BlockfrostProvider(
    process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY
  );

  const txBuilder: MeshTxBuilder = new MeshTxBuilder({
    fetcher: blockfrost,
    submitter: blockfrost,
    evaluator: new OfflineEvaluator(blockfrost, "preprod"),
  });

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateral = (await wallet.getCollateral())[0];
  const usedAddress = (await wallet.getUsedAddresses())[0];
  const { pubKeyHash } = deserializeAddress(usedAddress);

  const oracleNFTMintingScriptCbor = getOracleNFTSpendingScriptCbor();
  const oracleNFTAddress = getOracleNFTAddress();

  const bountyMintingPolicyId = getBountyMintingPolicyId();
  const bountyBoardScriptAddress = getBountyBoardScriptHash();
  const idMintingPolicyId = getIdMintingPolicyId();
  const idSpendingScriptAddress = getIdSpendingScriptHash();

  const oracleDatum: OracleNFTDatum = oracleNFTDatum(
    bountyMintingPolicyId,
    bountyBoardScriptAddress,
    idMintingPolicyId,
    idSpendingScriptAddress,
    pubKeyHash
  );

  try {
    const { oracleTxHash, oracleOutputIndex } = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );

    const unsignedTx = await txBuilder
      .spendingPlutusScriptV3()
      .txIn(oracleTxHash, oracleOutputIndex)
      .txInRedeemerValue(actionUpdate, "JSON")
      .txInScript(oracleNFTMintingScriptCbor)
      .txInInlineDatumPresent()
      .txOut(oracleNFTAddress, [
        {
          unit:
            process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID! +
            stringToHex(`${process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME}`),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(oracleDatum, "JSON")
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .requiredSignerHash(pubKeyHash)
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);

    console.log(txHash);

    await updateUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!,
      "0",
      txHash
    );
  } catch (e) {
    console.error(e);
  }
};
