import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";
import blueprint from "../../../../../aiken-workspace/plutus.json";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  applyCborEncoding,
  serializePlutusScript,
  mTuple,
  CIP68_100,
  CIP68_222,
  deserializeAddress,
} from "@meshsdk/core";
import { getUtxoApiRoute, updateUtxoApiRoute } from "./api_common";

export const mintIdToken = async (github: string, wallet: IWallet) => {
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

  const idSpendingScriptCbor = applyParamsToScript(
    blueprint.validators[7]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
    ],
    "Mesh"
  );

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

  const idSpendingScriptAddress = serializePlutusScript(
    {
      code: idSpendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const idMintingPolicyId = resolveScriptHash(idMintingScriptCbor, "V3");

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
    const oracleResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );

    const counterResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_ASSET_NAME!
    );

    const unsignedTx = await txBuilder
      .readOnlyTxInReference(
        oracleResult.oracleTxHash,
        oracleResult.oracleOutputIndex
      )
      .spendingPlutusScriptV3()
      .txIn(counterResult.oracleTxHash, counterResult.oracleOutputIndex)
      .txInRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txInScript(idOracleCounterSpendingScriptCbor)
      .txInInlineDatumPresent()
      .mintPlutusScriptV3()
      .mint(
        "1",
        idMintingPolicyId,
        CIP68_100(process.env.NEXT_PUBLIC_COLLECTION_NAME!)
      )
      .mintingScript(idMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .mintPlutusScriptV3()
      .mint(
        "1",
        idMintingPolicyId,
        CIP68_222(process.env.NEXT_PUBLIC_COLLECTION_NAME!)
      )
      .mintingScript(idMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txOut(idOracleCounterAddress, [
        {
          unit:
            process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_POLICY_ID! +
            stringToHex(""),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(oracleDatum, "JSON")
      .txOut(idSpendingScriptAddress, [
        {
          unit:
            idMintingPolicyId +
            CIP68_100(process.env.NEXT_PUBLIC_COLLECTION_NAME!),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(
        JSON.stringify({
          constructor: 0,
          fields: [
            {
              bytes: stringToHex(github),
            },
            { list: [] },
          ],
        }),
        "JSON"
      )
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

    await updateUtxoApiRoute(
      process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_ASSET_NAME!,
      "0",
      txHash
    );
  } catch (e) {
    console.error(e);
  }
};

// JSON.stringify({
//   constructor: 0,
//   fields: [
//     {
//       bytes: stringToHex("aaa@github.com"),
//     },
//     { list: [
//       {
//         constructor: 0,
//         fields: [
//           {
//             "list": [
//               {
//                 "bytes": pubKeyHash
//               }
//             ]
//           },
//           {
//             "int": 10000
//           }
//         ]
//       }
//     ] },
//   ],
// }),
