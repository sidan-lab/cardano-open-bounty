import {
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  deserializeAddress,
  applyCborEncoding,
  CIP68_100,
  CIP68_222,
  serializePlutusScript,
  mConStr0,
  txOutRef,
  outputReference,
  mOutputReference,
} from "@meshsdk/core";
import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";

export const OracleMint = async (wallet: BrowserWallet) => {
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
  const pubKeyHash = deserializeAddress(usedAddress).pubKeyHash;

  const mintingScriptCbor = applyParamsToScript(
    "5901880101003232323232323222533300332323232325332330093001300a3754004264646464a66601a600a0022a666020601e6ea801c0085854ccc034c00c00454ccc040c03cdd50038010b0b18069baa006132325333010301300213232323253330113009301237540162a6660220022600e00829404cdc38022400264660020026eb0c05800c894ccc05400452809991299980a19baf30193016375400402629444cc010010004c05c004c060004dd5980a180a980a980a980a80098081baa009375a601e0022c602200264a6660186004601a6ea800452f5bded8c026eacc044c038dd500099198008009bab30113012301230123012300e375400e44a666020002298103d87a80001323332225333011337220100062a66602266e3c02000c4cdd2a40006602a6e980092f5c02980103d87a8000133006006001375c601e0026eacc040004c050008c048004dc3a40046eb8c038c02cdd50011b874800058c030c03400cc02c008c028008c028004c014dd50008a4c26cacae6955ceaab9e5573eae815d0aba21",
    [mOutputReference(utxos[0]!.input.txHash, utxos[0]!.input.outputIndex)],
    "Mesh"
  );

  const policyId = resolveScriptHash(mintingScriptCbor, "V3");

  try {
    const unsignedTx = await txBuilder
      .txIn(utxos[0].input.txHash, utxos[0].input.outputIndex)
      .mintPlutusScriptV3()
      .mint("1", policyId, stringToHex("oracle"))
      .mintingScript(mintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .requiredSignerHash(pubKeyHash)
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .txOut(
        "addr_test1wzglwsx638upaa0fjfjw93yzl947jm82klu7g7g87s2dhxcrk4rqn",
        [{ unit: policyId + stringToHex("oracle"), quantity: "1" }]
      )
      .txOutInlineDatumValue(
        JSON.stringify({
          constructor: 0,
          fields: [
            {
              bytes: policyId,
            },
            {
              constructor: 0,
              fields: [
                {
                  constructor: 1,
                  fields: [
                    {
                      bytes:
                        "91f740da89f81ef5e99264e2c482f96be96ceab7f9e47907f414db9b",
                    },
                  ],
                },
                {
                  constructor: 1,
                  fields: [],
                },
              ],
            },
            {
              bytes: "264b8d5c046b8226ba104011ca8157650051b748274756318513b03c",
            },
            {
              constructor: 0,
              fields: [
                {
                  constructor: 1,
                  fields: [
                    {
                      bytes:
                        "91f740da89f81ef5e99264e2c482f96be96ceab7f9e47907f414db9b",
                    },
                  ],
                },
                {
                  constructor: 1,
                  fields: [],
                },
              ],
            },
          ],
        }),
        "JSON"
      )
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);
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
// "JSON"
// Exercise 2: Try to decode this cbor and find the following information:
// Inputs
// Outputs
// Mint
// transaction_witness_set.vkeywitness
// transaction_witness_set.native_script

// While this seems like a very simple transaction, there is actually a lot going on.
// In particular, an asset's identity is separated into two parts, something called a policy id, and the asset's name.
// Exercise 2a: Could you try and find information on what a policy id is?
// After which, try to explain concisely what the above nativeScript is doing.
