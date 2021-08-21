<template>
    <section v-if="tokenBalances">
        <div class="columns">
          <div class="column is-two-fifths">
            <article class="box is-hidden-mobile">
                <p class="title is-5">
                  <b-tag type="is-primary" class="mr-2">NEW</b-tag>
                  <span>EDEN Token Details</span>
                </p>
                <div class="content is-family-secondary">
                  <div class="levels mb-5">
                    <div class="level-left">
                      <div class="level-item m-0">
                        <figure class="image is-48x48">
                          <img class="is-rounded" src="../assets/EDEN.png">
                        </figure>
                      </div>
                      <div class="level-item m-0">
                        <p>
                          <strong>Eden Token (EDEN)</strong><br />
                          <span>{{ edenToken | shortEth }}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <p>
                    <b-button type="is-primary" rounded expanded tag="a" href="https://etherscan.io/address/0x1559fa1b8f28238fd5d76d9f434ad86fd20d1559" target="_blank">
                      <span>View on Etherscan&nbsp;&nearr;</span>
                    </b-button>
                  </p>
                  <p>
                    <b-button type="is-dark" rounded expanded @click="addToMetaMask">
                      <span>Add to MetaMask</span>
                    </b-button>
                  </p>
                </div>
            </article>
          </div>
          <div class="column is-three-fifths">
            <div class="box">
            <p class="title is-4">Migrate your ARCH tokens to EDEN</p>
              <b-message v-if="hasSLPtoUnstake()">
                You have SLP tokens to <router-link :to="{ name: 'Staking' }">unstake</router-link>
              </b-message>
              <b-message v-if="hasSLPtoRemove()">
                You have SLP tokens on <a href="https://app.sushi.com/remove/ETH/0x1F3f9D3068568F8040775be2e8C03C103C61f3aF" target="_blank">Sushi&nbsp;&nearr;</a>
              </b-message>
              <b-message v-if="hasARCHtoUnstake()">
                You have ARCH tokens to <router-link :to="{ name: 'Staking' }">unstake</router-link>
              </b-message>
            <b-field grouped label="ARCH to migrate" class="mt-6">
              <b-input 
                :value="format(amountToMigrate)"
                :autofocus="true"
                :disabled="approving || migrating"
                @input="onMigrationInput"
                placeholder="Amount"
                type="text" 
                size="is-medium has-text-right"
                expanded
              >
              </b-input>
              <p class="control">
                  <b-button 
                    :disabled="approving || migrating"
                    type="is-text" 
                    size="is-medium"
                    @click="setMax()"
                  >
                    Max
                  </b-button>
              </p>
            </b-field>
            <b-field label="Available ARCH balance" class="mt-4">
              <p class="is-family-secondary">
                {{ formatTokenBalance(tokenBalance(selectedToken), selectedToken) }}
              </p>
            </b-field>
            <b-field label="New EDEN balance" class="mt-4">
              <p class="is-family-secondary">
                {{ getNewValue(tokenBalance(edenToken), amountToMigrate) }} EDEN
              </p>
            </b-field>
            <div class="columns mt-4">
              <div class="column">
                <b-button 
                        rounded
                        type="is-success"
                        size="is-large"
                        :disabled="approved || !isAmountToMigrateValid()"
                        @click="approve"
                        :loading="approving"
                        expanded
                >
                    Approve
                </b-button>
              </div>
              <div class="column">
                <b-button 
                        rounded
                        type="is-success"
                        size="is-large"
                        :disabled="!approved || !isAmountToMigrateValid()"
                        @click="migrate"
                        :loading="migrating"
                        expanded
                >
                    Migrate
                </b-button>
              </div>
            </div>
        </div>
          </div>
        </div>
    </section>
</template>

<script>
  import AnimatedNumber from "animated-number-vue";
  import { utils, BigNumber } from "ethers";

  export default {
    components: {
      AnimatedNumber,
    },
    data() {
      return {
        approved: false,
        approving: false,
        migrating: false,
        amountToMigrate: null,
        selectedToken: this.stakingTokenList[0],
        edenToken: "0x1559fa1b8f28238fd5d76d9f434ad86fd20d1559"
      };
    },
    props: [
      'approvedBalances', 
      'pendingBalances',
      'stakedBalances',
      'tokenBalances',
      'stakingTokenList'
    ],
    methods: {
      approvedBalance(token) {
        try {
          return this.approvedBalances[token.address];
        }
        catch {
          return BigNumber.from("0");
        }
      },
      hasARCHtoUnstake() {
        try {
          return this.stakedBalances[this.stakingTokenList[0].address].gt("0");
        }
        catch {
          return false
        }
      },
      hasSLPtoUnstake() {
        try {
          return this.stakedBalances[this.stakingTokenList[1].address].gt("0");
        }
        catch {
          return false
        }
      },
      hasSLPtoRemove() {
        try {
          return this.tokenBalances[this.stakingTokenList[1].address].gt("0");
        }
        catch {
          return false
        }
      },
      stakedBalance(token) {
        try {
          return this.stakedBalances[token.address];
        }
        catch {
          return BigNumber.from("0");
        }
      },
      tokenBalance(token) {
        try {
          return this.tokenBalances[token.address] || this.tokenBalances[token];
        }
        catch {}
        return BigNumber.from("0");
      },
      setMax() {
        // ignore if max is pressed twice
        if (BigNumber.isBigNumber(this.amountToMigrate) && this.tokenBalance(this.selectedToken).eq(this.amountToMigrate)) {
          return;
        }
        this.amountToMigrate = this.tokenBalance(this.selectedToken);
        this.onMigrationInput(this.format(this.amountToMigrate));
      },
      onMigrationInput(value) {
        this.amountToMigrate = this.inputToBigNumber(value);
        if (
          this.amountToMigrate 
          && this.amountToMigrate.gt("0") 
          && this.approvedBalance(this.selectedToken).gte(this.amountToMigrate)
        ) {
          // Account has on-chain approval
          this.approved = true;
        }
        else {
          // No on-chain approval
          this.approved = false;
        }
      },
      format(value) {
        try {
          const decimal = utils.formatEther(value); // BN to string
          const formatted = decimal.replace(/[.]0*$/, '') // Drop trailing zeroes
          return formatted;
        }
        catch {
          return null;
        }
      },
      inputToBigNumber(value) {
        try {
          const validInput = value.match(/^[^\D]*[.]{0,1}[^\D]{0,18}/)[0]; // Match a valid decimal
          return utils.parseEther(validInput); // user input to BN
        }
        catch (err) {
          return null;
        }
      },
      to0DpAndCurrencyFormatted(value) {
        const decimal = this.$options.filters.fromWei(value);
        const formatted = this.$options.filters.currency(decimal);
        return `${formatted}`;
      },
      formatTokenBalance(value, token) {
        try {
          return `${this.to0DpAndCurrencyFormatted(value)} ${token.symbol}`;
        }
        catch {
          return `0`;
        }
      },
      getNewValue(currentValue, amount, addition=true) {
        let newValue;

        if (BigNumber.isBigNumber(currentValue) && BigNumber.isBigNumber(amount)) {
          if (addition) {
            newValue = currentValue.add(amount);
          }
          else if (amount.lt(currentValue)) {
            newValue = currentValue.sub(amount);
          }
        }
        else {
          newValue = currentValue;
        }
        return `${this.to0DpAndCurrencyFormatted(newValue)}`;
      },
      isAmountToMigrateValid() {
        try {
          return this.amountToMigrate.gt("0") && this.amountToMigrate.lte(this.tokenBalance(this.selectedToken));
        }
        catch {
          return false;
        }
      },
      async approve() {
        this.approving = true;
        let approveResult;
        try {
          approveResult = await this.$store.dispatch('approveARCHForMigration');
        }
        catch {
          approveResult = false;
        }
        this.approving = false;
        this.approved = approveResult;
      },
      addToMetaMask() {
        this.$store.dispatch('addToMetaMask');
      },
      async migrate() {
        this.migrating = true;
        let migrationResult;
        try {
          migrationResult = await this.$store.dispatch('migrateARCHToEDEN', this.amountToMigrate);
        }
        catch (err) {
          migrationResult = false;
        }
        if (migrationResult) {
          this.amountToMigrate = null;
          this.onMigrationInput(null);
        }
        this.migrating = false;
      },
    },
  };
</script>
