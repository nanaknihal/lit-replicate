import { ethers } from 'ethers';
import * as siwe from 'siwe';
import * as LitJsSdk from '@lit-protocol/lit-node-client-nodejs';
import PKPNFT from './PKPNFT.json' assert { type: 'json' };
import PKPPermissions from './PKPPermissions.json' assert { type: 'json' };
import * as basex from 'base-x';
import * as dotenv from 'dotenv';

const bs58 = basex.default('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
dotenv.config();

const PKP_CONTRACT = '0x58582b93d978F30b4c4E812A16a7b31C035A69f7'
const PKP_PERMISSION_CONTRACT = '0xD01c9C30f8F6fa443721629775e1CC7DD9c9e209';

// converts IPFS CID to format for the Lit contract
function getBytesFromMultihash(multihash) {
    const decoded = bs58.decode(multihash);
  
    return `0x${Buffer.from(decoded).toString("hex")}`;
}

const wallet = new ethers.Wallet(process.env.INSECURE_PRIVATE_KEY);
const randomWallet = ethers.Wallet.createRandom();

const provider = new ethers.JsonRpcProvider('https://chain-rpc.litprotocol.com/http');
const signer = wallet.connect(provider);

const pkp = new ethers.Contract(PKP_CONTRACT, PKPNFT.abi, signer);
const permission = new ethers.Contract(PKP_PERMISSION_CONTRACT, PKPPermissions.abi, signer);

const tokenId = 20356620860407450696470618291909365215408354866031004937927039184033920756680n;
const pubkey = await pkp.getPubkey(tokenId);
const ipfsCID = 'QmXy5BzcAanD5P29DpEkbRQcLy258j4QSuNeACRCTuyU1P';
const ipfsCIDBytes = bs58.decode(ipfsCID);
console.log('Lit action has permission? ', await permission.isPermittedAction(tokenId, ipfsCIDBytes)) // Returns true


const runLitAction = async () => {
    const litNodeClient = new LitJsSdk.LitNodeClientNodeJs({ litNetwork: "cayenne" });
    await litNodeClient.connect();
    const signatures = await litNodeClient.executeJs({
      ipfsId: ipfsCID,
      // code: litActionCode,
      authSig: await myAuthSig(randomWallet),
      // all jsParams can be used anywhere in your litActionCode
      jsParams: {
        // put a hash of data to be signed here:
        toSign: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        publicKey: pubkey,
        sigName: "sig1",
      },
    });
    console.log("signatures: ", signatures);
  }; 
  
  console.log('out', await runLitAction());





async function myAuthSig(wallet) {
    const siweMessage = new siwe.SiweMessage({
        domain: "localhost",
        address: wallet.address,
        statement: "This is a test statement.  You can put anything you want here.",
        uri: "https://localhost/login",
        version: "1",
        chainId: 1,
    });

    const messageToSign = siweMessage.prepareMessage();
    const signature = await wallet.signMessage(messageToSign);
    const recoveredAddress = ethers.verifyMessage(messageToSign, signature);

    const authSig = {
        sig: signature,
        derivedVia: "web3.eth.personal.sign",
        signedMessage: messageToSign,
        address: recoveredAddress,
    };

    return authSig;
}

