import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";
import blueprint from "../../../../../aiken-workspace/plutus.json";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  deserializeAddress,
  applyCborEncoding,
  serializePlutusScript,
  mOutputReference,
  Data,
} from "@meshsdk/core";
import { insertUtxoApiRoute } from "./api_common";

export const mintOracleCounter = async (wallet: IWallet) => {
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

  const oracleDatum = JSON.stringify({
    constructor: 0,
    fields: [
      {
        int: 0,
      },
      {
        constructor: 0,
        fields: [
          {
            constructor: 0,
            fields: [
              {
                bytes: pubKeyHash,
              },
            ],
          },
          {
            constructor: 1,
            fields: [
              {
                bytes: stakeCredentialHash,
              },
            ],
          },
        ],
      },
    ],
  });

  try {
    const unsignedTx = await txBuilder
      .txIn(
        paramUtxo.input.txHash,
        paramUtxo.input.outputIndex,
        paramUtxo.output.amount,
        paramUtxo.output.address
      )
      .mintPlutusScriptV3()
      .mint("1", idOracleCounterPolicyId, stringToHex(""))
      .mintingScript(idOracleCounterMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txOut(idOracleCounterAddress, [
        {
          unit: idOracleCounterPolicyId + stringToHex(""),
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
    console.log(idOracleCounterPolicyId);

    await insertUtxoApiRoute(
      process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_ASSET_NAME!,
      "0",
      txHash
    );
  } catch (e) {
    console.error(e);
  }
};
