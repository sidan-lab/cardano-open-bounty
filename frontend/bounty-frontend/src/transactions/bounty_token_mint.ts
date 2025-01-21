import { OfflineEvaluator } from "@meshsdk/core-csl";
import {
  BlockfrostProvider,
  CIP68_222,
  IWallet,
  MeshTxBuilder,
  stringToHex,

  // deserializeAddress,
} from "@meshsdk/core";
import { getUtxoApiRoute } from "../pages/common/api_common";
import { ApiMiddleware } from "@/middleware/api";
import { actionMint, bountyDatum, BountyDatum } from "./types";
import {
  getBountyBoardScriptAddress,
  getBountyMintingPolicyId,
  getBountyMintingScriptCbor,
  getIdMintingPolicyId,
  getIdSpendingScriptCbor,
} from "./common";

export const mintBountyToken = async (
  issue_url: string,
  reward: number,
  wallet: IWallet
) => {
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
    process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY,
    0
  );
  const txBuilder: MeshTxBuilder = new MeshTxBuilder({
    fetcher: blockfrost,
    submitter: blockfrost,
    evaluator: new OfflineEvaluator(blockfrost, "preprod"),
    verbose: true,
  });

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateral = (await wallet.getCollateral())[0];
  // const usedAddress = (await wallet.getUsedAddresses())[0];
  // const { pubKeyHash } = deserializeAddress(usedAddress);

  const idSpendingScriptCbor = getIdSpendingScriptCbor();
  const bountyMintingScriptCbor = getBountyMintingScriptCbor();

  const bountyBoardScriptAddress = getBountyBoardScriptAddress();

  const idMintingPolicyId = getIdMintingPolicyId();
  const bountyMintingPolicyId = getBountyMintingPolicyId();

  const api = new ApiMiddleware(wallet);
  try {
    const { tokenName, tx_hash, outputIndex } = await api.getIdInfo();
    const oracleResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );

    const bountyOutputDatum: BountyDatum = bountyDatum(issue_url, reward);

    const unsignedTx = await txBuilder
      .readOnlyTxInReference(
        oracleResult.oracleTxHash,
        oracleResult.oracleOutputIndex
      )
      .spendingPlutusScriptV3()
      .txIn(tx_hash, outputIndex)
      .txInRedeemerValue("", "Mesh")
      .txInScript(idSpendingScriptCbor)
      .txInInlineDatumPresent()
      .mintPlutusScriptV3()
      .mint("1", bountyMintingPolicyId, stringToHex(tokenName))
      .mintingScript(bountyMintingScriptCbor)
      .mintRedeemerValue(actionMint, "JSON")
      .txOut(bountyBoardScriptAddress, [
        {
          unit: bountyMintingPolicyId + stringToHex(tokenName),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(bountyOutputDatum, "JSON")
      .txOut(changeAddress, [
        {
          unit: idMintingPolicyId + CIP68_222(stringToHex(tokenName)),
          quantity: "1",
        }, {
          unit: "lovelace",
          quantity: (reward * 1000000).toString(),
        },
      ])
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);

    // await insertMultiSigApiRoute(bounty_name, all_signatories, txHash, "0");

    console.log(txHash);
  } catch (e) {
    console.error(e);
  }
};
