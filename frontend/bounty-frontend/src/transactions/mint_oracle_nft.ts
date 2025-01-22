import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";
import blueprint from "../../../../aiken-workspace/plutus.json";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  deserializeAddress,
  mOutputReference,
  Data,
} from "@meshsdk/core";
import { insertUtxoApiRoute } from "../pages/common/api_common";
import { actionMint, oracleNFTDatum, OracleNFTDatum } from "./types";
import { getOracleNFTAddress } from "./common";

export const mintOracleNFT = async (wallet: IWallet) => {
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

  const paramUtxo = utxos[0]!;
  const param: Data = mOutputReference(
    paramUtxo.input.txHash,
    paramUtxo.input.outputIndex
  );

  const OracleNFTMintingScriptCbor = applyParamsToScript(
    blueprint.validators[11]!.compiledCode,
    [param]
  );

  const OracleNFTPolicyId = resolveScriptHash(OracleNFTMintingScriptCbor, "V3");

  const oracleNFTAddress = getOracleNFTAddress();

  const oracleDatum: OracleNFTDatum = oracleNFTDatum(
    pubKeyHash,
    pubKeyHash,
    pubKeyHash,
    pubKeyHash,
    pubKeyHash
  );

  try {
    const unsignedTx = await txBuilder
      .txIn(
        paramUtxo.input.txHash,
        paramUtxo.input.outputIndex,
        paramUtxo.output.amount,
        paramUtxo.output.address
      )
      .mintPlutusScriptV3()
      .mint(
        "1",
        OracleNFTPolicyId,
        stringToHex(`${process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME}`)
      )
      .mintingScript(OracleNFTMintingScriptCbor)
      .mintRedeemerValue(actionMint, "JSON")
      .txOut(oracleNFTAddress, [
        {
          unit:
            OracleNFTPolicyId +
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
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);
    console.log(OracleNFTPolicyId);

    await insertUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!,
      "0",
      txHash
    );
  } catch (e) {
    console.error(e);
  }
};
