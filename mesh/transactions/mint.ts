import {
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  deserializeAddress,
  applyCborEncoding,
} from "@meshsdk/core";
import { OfflineEvaluator } from "@meshsdk/core-csl";

export const mintExample = async (wallet: BrowserWallet) => {
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

  // Get utxos from wallet, with selection
  const mintingScriptCbor = applyCborEncoding(
    "590288010100323232323232323232322533300332323232325332330093001300b3754004264a66666602400826464a6660186008601c6ea80184c94ccc0440040304c94cccccc0580040340340340344c8c94ccc05000403c4c94cccccc06400454ccc054c0600084c94ccc048c02800454ccc058c054dd50010038088a99980918040008a99980b180a9baa00200701101130133754002020020020020020602c002602c0066eb8004c04c004c03cdd500300589919191929998098008010a999809980b000899199129998091805180a1baa30183019301537540182a666024a66602464646600200201044a66603200229404cc894ccc05ccdc78010028a51133004004001375c603600260380026eb8c060c054dd50060a5115330134901147369676e65725f636865636b203f2046616c73650014a02a6660246010002294454cc04d240113616d6f756e74203d3d2031203f2046616c73650014a029404cdc3800a40026eb8c048004dd69809800980a800801192999807980298089baa00114bd6f7b63009bab30153012375400264660020026eacc054010894ccc050004530103d87a80001323332225333014337220160062a66602866e3c02c00c4cdd2a4000660326e980092f5c02980103d87a8000133006006001375c60260026eacc050004c060008c0580045281bac301230133013301330130013012301230123012300e375400c6e1d2002009009009009375c601e60186ea8008dc3a40002c601a601c006601800460160046016002600c6ea800452615330044911856616c696461746f722072657475726e65642066616c73650013656153300249011472656465656d65723a204d7952656465656d657200165734ae7155ceaab9e5573eae815d0aba257481"
  );
  const policyId = resolveScriptHash(mintingScriptCbor, "V3");
  const tokenName = "mesh";
  const tokenNameHex = stringToHex(tokenName);

  try {
    const unsignedTx = await txBuilder
      .mintPlutusScriptV3()
      .mint("1", policyId, tokenNameHex)
      .mintingScript(mintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [
            {
              bytes: pubKeyHash,
            },
            {
              constructor: 0,
              fields: [],
            },
          ],
        }),
        "JSON"
      )
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .complete();
    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);
  } catch (e) {
    console.error(e);
  }
};

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
