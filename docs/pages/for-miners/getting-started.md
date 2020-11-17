Mine smarter with Archer. Archer boosts mining revenue and integration takes less than five minutes. For more information, read our [introductory post](https://medium.com/archer-dao/introducing-archer-66f20d2cc425).

# Geth Client Instructions

## Step 1 of 2

Restart your node(s) with the following additional [command-line flag](https://geth.ethereum.org/docs/interface/command-line-options) value:

```

--txpool.locals "0xa2cD5b9D50d19fDFd2F37CbaE0e880F9ce327837"

```

## Step 2 of 2

Email the peer ID (enode ID) of your node(s) to [office@archerdao.io](mailto:office@archerdao.io).

You can obtain your node's peer ID by calling the `admin_nodeInfo` [as outlined in the Geth documentation](https://geth.ethereum.org/docs/rpc/ns-admin#admin_nodeinfo) and copying the "enode" value in the returned JSON object.  

# Support

For any questions or concerns, please reach out to our team:

* Email: [office@archerdao.io](mailto:office@archerdao.io)

* [Telegram](https://t.me/archerdao)

* [Discord](https://discord.gg/98GV73f)
