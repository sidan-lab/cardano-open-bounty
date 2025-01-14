import {
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolveScriptHash,
  deserializeAddress,
  applyCborEncoding,
  serializePlutusScript,
} from "@meshsdk/core";
import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";


export const blockfrost_api_key = process.env.BLOCKFROST_API_KEY || "";

export const bounty_spending_raw_script =
  process.env.ALWAYS_SUCCEED_SCRIPT || "";

export const bounty_minting_raw_script =
  process.env.ALWAYS_SUCCEED_SCRIPT || "";

export const mintBountyToken = async (wallet: BrowserWallet) => {


  const blockfrost: BlockfrostProvider = new BlockfrostProvider(
    blockfrost_api_key,
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

  const bountyspendingScriptCbor = applyCborEncoding(
    bounty_spending_raw_script
  );

  const bounty_board_address = serializePlutusScript(
    {
      code: bountyspendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const bountymintingScriptCbor = applyParamsToScript(
    bounty_minting_raw_script,
    [{}],
    "JSON"
  );

  const policyId = resolveScriptHash(bountymintingScriptCbor, "V3");

  try {
    const unsignedTx = await txBuilder
      .mintPlutusScriptV3()
      .mint("1", policyId, pubKeyHash)
      .mintingScript(bountymintingScriptCbor)
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
      .txOut(bounty_board_address, [{ unit: pubKeyHash, quantity: "1" }])
      .txOutInlineDatumValue(
        JSON.stringify({
          constructor: 0,
          fields: [
            {
              bytes: "616263",
            },
            {
              constructor: 0,
              fields: [
                {
                  constructor: 1,
                  fields: [
                    {
                      bytes: "616263",
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
              bytes: "646566",
            },
            {
              constructor: 0,
              fields: [
                {
                  constructor: 1,
                  fields: [
                    {
                      bytes: "646566",
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
