import { OfflineEvaluator } from "@meshsdk/core-csl";
import { BlockfrostProvider, IWallet, MeshTxBuilder } from "@meshsdk/core";

import {
  getBountyBoardScriptCbor,
  getBountyMintingScriptCbor,
  getIdMintingScriptCbor,
  getIdSpendingScriptCbor,
} from "./common";

export const outputTxRefScript = async (wallet: IWallet) => {
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

  const idMintingScriptCbor = getIdMintingScriptCbor();
  const idSpendingScriptCbor = getIdSpendingScriptCbor();

  const bountyMintingScriptCbor = getBountyMintingScriptCbor();
  const bountySpendingScriptCbor = getBountyBoardScriptCbor();

  const scriptAddress =
    "addr_test1qqyxeduckrmffn26gjffda77nfu560xctycf00jcnr74p7vdx9gcw644ygkqgqcfm5nlrecqv0rzp0qcyw55q3lxcpkq093wet";
  try {
    const unsignedTxId = await txBuilder
      .txOut(scriptAddress, [])
      .txOutReferenceScript(idMintingScriptCbor)
      .txOut(scriptAddress, [])
      .txOutReferenceScript(idSpendingScriptCbor)
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTxId = await wallet.signTx(unsignedTxId, true);
    const txHashId = await wallet.submitTx(signedTxId);

    const unsignedTxBounty = await txBuilder
      .txOut(scriptAddress, [])
      .txOutReferenceScript(bountyMintingScriptCbor)
      .txOut(scriptAddress, [])
      .txOutReferenceScript(bountySpendingScriptCbor)
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTxBounty = await wallet.signTx(unsignedTxBounty, true);
    const txHashBounty = await wallet.submitTx(signedTxBounty);

    console.log(txHashId);
    console.log(txHashBounty);
  } catch (e) {
    console.error(e);
  }
};
