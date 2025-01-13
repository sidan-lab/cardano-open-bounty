import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";
import blueprint from "../../../../../aiken-workspace/plutus.json";
import {
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  deserializeAddress,
  applyCborEncoding,
  serializePlutusScript,
  mConStr0,
  mOutputReference,
  Data,
  mPubKeyAddress,
} from "@meshsdk/core";
import { neon } from "@neondatabase/serverless";
// import { ActionMint } from "./type";

export const mintOracleNFT = async (wallet: BrowserWallet) => {
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
  });

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateral = (await wallet.getCollateral())[0];
  const usedAddress = (await wallet.getUsedAddresses())[0];
  const { pubKeyHash, stakeCredentialHash } = deserializeAddress(usedAddress);

  const paramUtxo = utxos[0]!;
  const param: Data = mOutputReference(
    paramUtxo.input.txHash,
    paramUtxo.input.outputIndex
  );

  const OracleNFTSpendingScriptCbor = applyCborEncoding(
    blueprint.validators[16]!.compiledCode
  );

  const OracleNFTAddress = serializePlutusScript(
    {
      code: OracleNFTSpendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const OracleNFTMintingScriptCbor = applyParamsToScript(
    blueprint.validators[14]!.compiledCode,
    [param]
  );

  const OracleNFTPolicyId = resolveScriptHash(OracleNFTMintingScriptCbor, "V3");

  try {
    const unsignedTx = await txBuilder
      .txIn(
        paramUtxo.input.txHash,
        paramUtxo.input.outputIndex,
        paramUtxo.output.amount,
        paramUtxo.output.address
      )
      .mintPlutusScriptV3()
      .mint("1", OracleNFTPolicyId, stringToHex("oracle_nft"))
      .mintingScript(OracleNFTMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txOut(OracleNFTAddress, [
        { unit: OracleNFTPolicyId + stringToHex("oracle_nft"), quantity: "1" },
      ])
      .txOutInlineDatumValue(
        mConStr0([mPubKeyAddress(pubKeyHash, stakeCredentialHash)])
      )
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);
    console.log(OracleNFTPolicyId);
    const sql = neon(`${process.env.DATABASE_URL}`);
    await sql("INSERT INTO cardano_open_bounty (name, utxo) VALUES ($1, $2)", [
      "oracle_nft",
      paramUtxo.input,
    ]);
  } catch (e) {
    console.error(e);
  }
};

export const mintOracleCounter = async (wallet: BrowserWallet) => {
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
  });

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateral = (await wallet.getCollateral())[0];
  const usedAddress = (await wallet.getUsedAddresses())[0];
  const { pubKeyHash, stakeCredentialHash } = deserializeAddress(usedAddress);

  const paramUtxo = utxos[0]!;
  const param: Data = mOutputReference(
    paramUtxo.input.txHash,
    paramUtxo.input.outputIndex
  );

  const idOracleCounterSpendingScriptCbor = applyCborEncoding(
    blueprint.validators[12]!.compiledCode
  );

  const idOracleCounterAddress = serializePlutusScript(
    {
      code: idOracleCounterSpendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const idOracleCounterMintingScriptCbor = applyParamsToScript(
    blueprint.validators[14]!.compiledCode,
    [param]
  );

  const idOracleCounterPolicyId = resolveScriptHash(
    idOracleCounterMintingScriptCbor,
    "V3"
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
      .mint("1", idOracleCounterPolicyId, stringToHex("id_oracle_counter"))
      .mintingScript(idOracleCounterMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txOut(idOracleCounterAddress, [
        { unit: idOracleCounterPolicyId, quantity: "1" },
      ])
      .txOutInlineDatumValue(
        mConStr0([mPubKeyAddress(pubKeyHash, stakeCredentialHash)])
      )
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);

    console.log(txHash);
    console.log(idOracleCounterPolicyId);

    const sql = neon(`${process.env.DATABASE_URL}`);
    await sql("INSERT INTO cardano_open_bounty (name, utxo) VALUES ($1, $2)", [
      "id_oracle_counter",
      paramUtxo.input,
    ]);
  } catch (e) {
    console.error(e);
  }
};
