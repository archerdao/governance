import Notify from "bnc-notify";
import Onboard from "bnc-onboard";

import {
  SUPPORTED_CHAIN_ID,
  RPC_URL,
  BLOCKNATIVE_DAPP_ID,
  INFURA_KEY,
} from "@/settings";

export function initOnboard(subscriptions) {
  return Onboard({
    dappId: BLOCKNATIVE_DAPP_ID,
    hideBranding: true,
    networkId: SUPPORTED_CHAIN_ID,
    darkMode: true,
    subscriptions,
    walletSelect: {
      wallets: [
        {walletName: "metamask", preferred: true},
        {walletName: "trust", rpcUrl: RPC_URL},
        {walletName: "walletConnect", infuraKey: INFURA_KEY, preferred: true,},
      ],
    },
    walletCheck: [
      {checkName: "derivationPath"},
      {checkName: "connect"},
      {checkName: "accounts"},
      {checkName: "network"},
      {checkName: "balance", minimumBalance: "100000"},
    ],
  });
}

export function initNotify() {
  return Notify({
    dappId: BLOCKNATIVE_DAPP_ID,
    networkId: SUPPORTED_CHAIN_ID,
  });
}
