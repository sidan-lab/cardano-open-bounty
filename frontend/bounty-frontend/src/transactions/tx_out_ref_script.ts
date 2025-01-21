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
  insertUtxoApiRoute,
  updateUtxoApiRoute,
} from "../pages/common/api_common";
import {
  getBountyBoardScriptCbor,
  getBountyBoardScriptHash,
  getBountyMintingPolicyId,
  getBountyMintingScriptCbor,
  getIdMintingPolicyId,
  getIdMintingScriptCbor,
  getIdSpendingScriptCbor,
  getIdSpendingScriptHash,
  getOracleNFTAddress,
  getOracleNFTSpendingScriptCbor,
} from "./common";
import { actionUpdate, oracleNFTDatum, OracleNFTDatum } from "./types";

export const outputTxRefScrippt = async (wallet: IWallet) => {
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

  const idMintingScriptCbor = getIdMintingScriptCbor();
  const idSpendingScriptCbor = getIdSpendingScriptCbor();

  const bountyMintingScriptCbor = getBountyMintingScriptCbor();
  const bountySpendingScriptCbor = getBountyBoardScriptCbor();

  try {
    const unsignedTx = await txBuilder
      .spendingPlutusScriptV3()
      .txInScript(idSpendingScriptCbor)
      .txOutReferenceScript(idSpendingScriptCbor)
      .spendingPlutusScriptV3()
      .txInScript(bountySpendingScriptCbor)
      .txOutReferenceScript(bountySpendingScriptCbor)
      .mintPlutusScriptV3()
      .mintingScript(idMintingScriptCbor)
      .txOutReferenceScript(idMintingScriptCbor)
      .mintPlutusScriptV3()
      .mintingScript(bountyMintingScriptCbor)
      .txOutReferenceScript(bountyMintingScriptCbor)
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

    await insertUtxoApiRoute("ref_script", "0", txHash);
  } catch (e) {
    console.error(e);
  }
};
