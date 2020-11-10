Getting started with Archer DAO as a miner is easy.  The entire process will likely take less than 5 minutes and should have no impact on your mining operation outside of now allowing Archer transactions to be mined in your future blocks.

# Instructions for Geth 

If you use Geth to produce blocks, you simply need to restart your nodes with the following additional [command-line flag](https://geth.ethereum.org/docs/interface/command-line-options) value:

```

--txpool.locals "0xa2cD5b9D50d19fDFd2F37CbaE0e880F9ce327837"

```

Then, for each of your block-producing Geth nodes obtain your node's peer ID (enode ID).  You can obtain this value by calling the "admin_nodeInfo" [as outlined in the Geth documentation](https://geth.ethereum.org/docs/rpc/ns-admin#admin_nodeinfo) and copying the "enode" value in the returned JSON object.  

Please, then send your "enode" ID to the Archer team:

Email: caleb@blocklytics.org

If you use a client other than Geth to produce your blocks, please reach out to the team directly.
