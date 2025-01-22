import { OfflineEvaluator } from "@meshsdk/core-csl";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  stringToHex,
  CIP68_100,
} from "@meshsdk/core";
import {
  getUtxoApiRoute,
  insertUnsignedBountyApiRoute,
} from "../pages/common/api_common";
import { ApiMiddleware } from "@/middleware/api";
import {
  getBountyBoardScriptCbor,
  getBountyMintingPolicyId,
  getBountyMintingScriptCbor,
  getIdMintingPolicyId,
  getIdSpendingScriptAddress,
  getIdSpendingScriptCbor,
} from "./common";
import {
  actionBurn,
  bountyBurn,
  BountyBurn,
  contributorDatum,
  ContributorDatum,
} from "./types";
import { BountyWithName } from "@/services/type";

export const burnBountyToken = async (
  bounty: BountyWithName,
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

  const idMintingPolicyId = getIdMintingPolicyId();
  const idSpendingScriptCbor = getIdSpendingScriptCbor();
  const idSpendingScriptAddress = getIdSpendingScriptAddress();

  const bountyBoardScriptCbor = getBountyBoardScriptCbor();
  const bountyMintingScriptCbor = getBountyMintingScriptCbor();
  const bountyMintingPolicyId = getBountyMintingPolicyId();

  const api = new ApiMiddleware(wallet);
  try {
    const idNftTxResult = await api.getIdNftTx();
    const idRefTxResult = await api.getIdRefTx();
    const idInfoResult = await api.getIdInfo();
    const ownerIdInfoResult = await api.getOwnerIdInfo(bounty.name);
    const oracleResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );

    const contributions: Map<string, number> = idInfoResult.contributions;

    contributions.set(bounty.name, bounty.reward);

    const updateIdContributorDatum: ContributorDatum = contributorDatum(
      idInfoResult.contributor.metadata,
      idInfoResult.contributor.version,
      contributions,
      idInfoResult.contributor.pub_key_hash
    );

    const bountyRedeemer: BountyBurn = bountyBurn(idNftTxResult.tokenName);
    const unsignedTx = await txBuilder
      .readOnlyTxInReference(
        oracleResult.oracleTxHash,
        oracleResult.oracleOutputIndex
      )
      .readOnlyTxInReference(
        ownerIdInfoResult.tx_hash,
        ownerIdInfoResult.outputIndex
      )
      .txIn(idNftTxResult.txHash, idNftTxResult.index)
      .txIn(idRefTxResult.txHash, idRefTxResult.index)
      .txInRedeemerValue("", "JSON")
      .txInScript(idSpendingScriptCbor)
      .txInInlineDatumPresent()
      .txIn(bounty.txHash, bounty.outputIndex)
      .txInRedeemerValue(bountyRedeemer, "JSON")
      .txInScript(bountyBoardScriptCbor)
      .txInInlineDatumPresent()
      .mintPlutusScriptV3()
      .mint("-1", bountyMintingPolicyId, stringToHex(bounty.name))
      .mintingScript(bountyMintingScriptCbor)
      .mintRedeemerValue(actionBurn, "JSON")
      .txOut(idSpendingScriptAddress, [
        {
          unit:
            idMintingPolicyId + CIP68_100(stringToHex(idNftTxResult.tokenName)),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(updateIdContributorDatum, "JSON")
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .requiredSignerHash(ownerIdInfoResult.pubKeyHash)
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);

    await insertUnsignedBountyApiRoute(
      bounty.name,
      idInfoResult.gitHub,
      idInfoResult.contributions,
      signedTx,
      bounty.txHash,
      bounty.outputIndex
    );

    console.log(signedTx);
  } catch (e) {
    console.error(e);
  }
};
