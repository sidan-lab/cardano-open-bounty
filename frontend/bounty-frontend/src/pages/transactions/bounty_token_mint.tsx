import {
  BlockfrostProvider,
  MeshTxBuilder,
  resolveScriptHash,
  deserializeAddress,
  applyCborEncoding,
  serializePlutusScript,
  IWallet,
} from "@meshsdk/core";
import {  OfflineEvaluator } from "@meshsdk/core-csl";

export const blockfrost_api_key = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || "";

export const bounty_spending_raw_script =
  process.env.NEXT_PUBLIC_ALWAYS_SUCCEED_SCRIPT || "";

export const bounty_minting_raw_script =
  process.env.NEXT_PUBLIC_ALWAYS_SUCCEED_SCRIPT || "";

export const mintBountyToken = async (wallet: IWallet) => {
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
    "5834010100323232322533300232323232324a260106012004600e002600e004600a00260066ea8004526136565734aae795d0aba201"
  );

  const bounty_board_address = serializePlutusScript(
    {
      code: bountyspendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const bountymintingScriptCbor = applyCborEncoding(
    "5834010100323232322533300232323232324a260106012004600e002600e004600a00260066ea8004526136565734aae795d0aba201"
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
      .txOut(bounty_board_address, [
        { unit: policyId + pubKeyHash, quantity: "1" },
      ])
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
