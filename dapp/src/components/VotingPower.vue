<template>
    <section v-if="votingPower">
        <div class="columns">
          <!-- <div class="column is-two-fifths"> -->
            <!-- <article class="notification is-primary">
                <p class="title is-2">
                    <animated-number
                            :value="votingPower && votingPower.toString()"
                            :duration="1200"
                            :formatValue="to0DpAndCurrencyFormatted"
                    />
                </p>
              <p class="subtitle is-5">Voting Power</p>
            </article> -->
            <!-- <article class="notification is-success">
                <p class="title is-2 mb-0">
                    <animated-number
                            :value="pendingBalances[0].amount.mul('333').div('1000').toString()"
                            :duration="1200"
                            :formatValue="to2DpAndCurrencyFormatted"
                    />
                    {{ pendingBalances[0].symbol }}
                </p>
                <p class="title is-2">
                    <animated-number
                            :value="pendingBalances[1].amount.toString()"
                            :duration="1200"
                            :formatValue="to2DpAndCurrencyFormatted"
                    />
                    {{ pendingBalances[1].symbol }}
                </p>
              <p class="subtitle is-5">Claimable Rewards</p>
            </article> -->
            <!-- <article class="box is-hidden-mobile">
                <p class="title is-5">
                  <b-tag type="is-success" class="mr-2">NEW</b-tag>
                  <span>Triple Rewards</span>
                </p>
                <div class="content is-family-secondary">
                  <p>Earn ARCH+SUSHI+VOTING POWER by providing liquidity on SushiSwap and staking SLP.</p>
                  <p>
                    <b-button type="is-text" tag="a" href="https://docs.archerdao.io/for-token-holders/liquidity-mining" target="_blank">
                      <span>Learn more</span>
                      <span class="icon is-small ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                    <b-button type="is-text" tag="a" href="https://app.sushi.com/pair/0x4441eb3076f828d5176f4fe74d7c775542dae106" target="_blank">
                      <span>Visit SushiSwap</span>
                      <span class="icon is-small ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                  </p>
                </div>
            </article> -->
            <!-- <article class="box is-hidden-mobile">
                <p class="title is-5">What can I do with voting power?</p>
                <div class="content is-family-secondary">
                  <p>
                    <b-button type="is-text" tag="a" href="https://gov.archerdao.io/" target="_blank">
                      <b-tag type="is-primary" class="mr-2">&gt;0</b-tag>
                      <span>Vote on network issues</span>
                      <span class="icon is-small ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                    <b-button type="is-text" tag="a" href="https://discord.gg/98GV73f" target="_blank">
                      <b-tag type="is-primary" class="mr-2">10k</b-tag>
                      <span>Access private Discord channels</span>
                      <span class="icon is-small is-link ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                    <b-button type="is-text" tag="a" href="https://gov.archerdao.io/" target="_blank">
                      <b-tag type="is-primary" class="mr-2">20k</b-tag>
                      <span>Propose new votes</span>
                      <span class="icon is-small ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                  </p>
                </div>
            </article> -->
            <!-- </div> -->
        <div class="column is-one-fifth">
        </div>
        <div class="column is-three-fifths">
          <b-tabs v-model="activeTab" expanded class="box" size="is-medium">
            <b-tab-item label="Stake" component="button" disabled>
              <!-- <p class="title is-4" v-if="selectedToken.symbol === `SLP`">Increase your voting power and earn rewards</p> -->
              <!-- <p class="title is-4" v-else>Increase your voting power</p> -->
              <p class="title is-4">Increase your voting power</p>
              <b-field grouped label="Tokens to stake" class="mt-6">
                <p class="control">
                  <b-select 
                    placeholder="ARCH" 
                    size="is-medium" 
                    v-model="selectedToken"
                    :disabled="approving || staking"
                  >
                      <option
                          v-for="token in stakingTokenList"
                          :value="token"
                          :key="token.address">
                          {{ token.symbol }}
                      </option>
                  </b-select>
                </p>
                <b-input 
                  :value="format(amountToStake)"
                  :autofocus="true"
                  :disabled="approving || staking"
                  @input="onStakeInput"
                  placeholder="Amount"
                  type="text" 
                  size="is-medium has-text-right"
                  expanded
                >
                </b-input>
                <p class="control">
                    <b-button 
                      :disabled="approving || staking"
                      type="is-text" 
                      size="is-medium"
                      @click="setMax(true)"
                    >
                      Max
                    </b-button>
                </p>
              </b-field>
              <b-field label="Available balance" class="mt-4">
                <p class="is-family-secondary">
                  {{formatTokenBalance(tokenBalance(selectedToken), selectedToken)}}
                  <a class="is-family-secondary" href="https://app.sushi.com/pair/0x4441eb3076f828d5176f4fe74d7c775542dae106" target="_blank">
                    <span>Get more</span>
                    <span class="icon is-small ml-1">
                      <i class="mdi mdi-arrow-top-right"></i>
                    </span>
                  </a>
                </p>
              </b-field>
              <b-field label="New voting power" class="mt-4">
                <p class="is-family-secondary">{{ getNewVotingPower(votingPower, amountToStake) }}</p>
              </b-field>
              <div class="columns mt-4">
                <div class="column">
                  <b-button 
                          rounded
                          type="is-success"
                          size="is-large"
                          :disabled="approved || !isAmountToStakeValid()"
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
                          :disabled="!approved || !isAmountToStakeValid()"
                          @click="stake"
                          :loading="staking"
                          expanded
                  >
                      Stake
                  </b-button>
                </div>
              </div>
            </b-tab-item>
            <b-tab-item label="Unstake">
              <!-- <p class="title is-4" v-if="selectedToken.symbol === `SLP`">Decrease your voting power and claim rewards</p> -->
              <!-- <p class="title is-4" v-else>Decrease your voting power</p> -->
              <p class="title is-4">Unstake your tokens</p>
              <b-field grouped label="Tokens to unstake"  class="mt-6">
                <p class="control">
                  <b-select 
                    placeholder="ARCH" 
                    size="is-medium" 
                    v-model="selectedToken"
                    :disabled="withdrawing"
                  >
                      <option
                          v-for="token in stakingTokenList"
                          :value="token"
                          :key="token.address">
                          {{ token.symbol }}
                      </option>
                  </b-select>
                </p>
                <b-input 
                  :disabled="withdrawing"
                  :value="format(amountToUnstake)"
                  @input="onUnstakeInput"
                  placeholder="Amount"
                  type="text" 
                  size="is-medium has-text-right"
                  expanded
                >
                </b-input>
                <p class="control">
                    <b-button 
                      :disabled="withdrawing"
                      type="is-text" 
                      size="is-medium"
                      @click="setMax(false)"
                    >
                      Max
                    </b-button>
                </p>
              </b-field>
              <b-field label="Staked balance" class="mt-4">
                <p class="is-family-secondary">{{formatTokenBalance(stakedBalance(selectedToken), selectedToken)}}</p>
              </b-field>
              <!-- <b-field label="New voting power" class="mt-4">
                <p class="is-family-secondary">{{ getNewVotingPower(votingPower, amountToUnstake, false) }}</p>
              </b-field> -->
              <div class="columns mt-4">
                <div class="column">
                  <b-button
                          rounded
                          type="is-success"
                          size="is-large"
                          :disabled="!isAmountToUnstakeValid()" 
                          @click="withdraw"
                          :loading="withdrawing"
                          expanded
                  >
                      Unstake
                  </b-button>
                </div>
              </div>
            </b-tab-item>
            <b-tab-item label="Claim">
              <p class="title is-4">Claim liquidity mining rewards</p>
              <p class="subtitle is-6">NOTE: This program has ended for new depositors</p>
              <b-field grouped label="Claimable now"  class="mt-6">
                <ul>
                  <li><p class="is-family-secondary">
                    {{ to6DpAndCurrencyFormatted(pendingBalances[0].amount.mul("333").div("1000")) }} {{ pendingBalances[0].symbol }}
                  </p></li>
                  <li><p class="is-family-secondary">
                    {{ to6DpAndCurrencyFormatted(pendingBalances[1].amount) }} {{ pendingBalances[1].symbol }}
                  </p></li>
                </ul>
              </b-field>
              <b-field grouped label="Vesting"  class="mt-6">
                <ul>
                  <li><p class="is-family-secondary">
                    {{ to6DpAndCurrencyFormatted(pendingBalances[0].amount.mul("667").div("1000")) }} {{ pendingBalances[0].symbol }} available over six months
                  </p></li>
                  <li><p class="is-family-secondary">
                    {{ to6DpAndCurrencyFormatted(pendingBalances[1].amount.mul("2")) }} {{ pendingBalances[1].symbol }} available after six months
                  </p></li>
                </ul>
              </b-field>
              <!-- <b-field grouped label="Tokens to unstake"  class="mt-6">
                <p class="is-family-secondary">xyz</p>
              </b-field>
              <b-field label="New voting power" class="mt-4">
                <p class="is-family-secondary">xyz</p>
              </b-field> -->
              <div class="columns mt-4">
                <div class="column">
                  <b-button
                          rounded
                          type="is-success"
                          size="is-large"
                          :disabled="!isClaimRewardsValid()" 
                          @click="claimRewards"
                          :loading="claiming"
                          expanded
                  >
                      Claim and Start Vesting
                  </b-button>
                </div>
              </div>
            </b-tab-item>
          </b-tabs>
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
        claiming: false,
        staking: false,
        withdrawing: false,
        amountToStake: null,
        amountToUnstake: null,
        activeTab: 1,
        selectedToken: this.stakingTokenList[0],
      };
    },
    props: [
      'approvedBalances', 
      'pendingBalances',
      'stakedBalances',
      'tokenBalances',
      'stakingTokenList',
      'votingPower'
    ],
    methods: {
      approvedBalance(token) {
        // try {
        //   console.log("debug::approvedBalance", this.approvedBalances[token.address].toString())
        //   return this.approvedBalances[token.address];
        // }
        // catch {}
        return BigNumber.from("0");
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
          return this.tokenBalances[token.address];
        }
        catch {
          return BigNumber.from("0");
        }
      },
      setMax(staking=true) {
        if (staking) {
          // ignore if max is pressed twice
          if (BigNumber.isBigNumber(this.amountToStake) && this.tokenBalance(this.selectedToken).eq(this.amountToStake)) {
            return;
          }
          this.amountToStake = this.tokenBalance(this.selectedToken);
          this.onStakeInput(this.format(this.amountToStake));
        }
        else {
          // ignore if max is pressed twice
          if (BigNumber.isBigNumber(this.amountToStake) && this.stakedBalance(this.selectedToken).eq(this.amountToUnstake)) {
            return;
          }
          this.amountToUnstake = this.stakedBalance(this.selectedToken);
          this.onUnstakeInput(this.format(this.amountToUnstake));
        }
      },
      onStakeInput(value) {
        this.amountToStake = this.inputToBigNumber(value);
        this.approved = false;
        // if (
        //   this.amountToStake 
        //   && this.amountToStake.gt("0") 
        //   && this.approvedBalance(this.selectedToken).gte(this.amountToStake)
        // ) {
        //   // Account has on-chain approval
        //   this.approved = true;
        // }
        // else {
        //   // No on-chain approval
        //   this.approved = false;
        // }
      },
      onUnstakeInput(value) {
        this.amountToUnstake = this.inputToBigNumber(value);
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
      to2DpAndCurrencyFormatted(value) {
        const decimal = this.$options.filters.fromWei(value);
        const formatted = this.$options.filters.currency_2(decimal);
        return `${formatted}`;
      },
      to6DpAndCurrencyFormatted(value) {
        const decimal = this.$options.filters.fromWei(value);
        const formatted = this.$options.filters.currency_6(decimal);
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
      getNewVotingPower(currentValue, amount, staking=true) {
        let newVotingPower;
        let vpRatioNumerator = this.selectedToken.ratio;
        let vpRatioDivisor = BigNumber.from("10").pow("18");

        if (BigNumber.isBigNumber(currentValue) && BigNumber.isBigNumber(amount)) {
          let votingPowerDelta = amount.mul(vpRatioNumerator).div(vpRatioDivisor)
          if (staking) {
            newVotingPower = currentValue.add(votingPowerDelta);
          }
          else if (votingPowerDelta.lt(currentValue)) {
            newVotingPower = currentValue.sub(votingPowerDelta);
          }
        }
        else {
          newVotingPower = currentValue;
        }
        return `${this.to0DpAndCurrencyFormatted(newVotingPower)}`;
      },
      isAmountToStakeValid() {
        try {
          return this.amountToStake.gt("0") && this.amountToStake.lte(this.tokenBalance(this.selectedToken));
        }
        catch {
          return false;
        }
      },
      isAmountToUnstakeValid() {
        try {
          return this.amountToUnstake.gt("0") && this.amountToUnstake.lte(this.stakedBalance(this.selectedToken));
        }
        catch {
          return false;
        }
      },
      isClaimRewardsValid() {
        try {
          return this.pendingBalances[0].amount.gt("0") || this.pendingBalances[1].amount.gt("0");
        }
        catch {
          return false;
        }
      },
      async approve() {
        this.approving = true;
        let approveResult;
        try {
          if (this.selectedToken.symbol == "ARCH") {
            approveResult = await this.$store.dispatch('approve', this.amountToStake);
          }
          else if (this.selectedToken.symbol == "SLP") {
            approveResult = await this.$store.dispatch('approveSLP', this.amountToStake);
          }
          else {
            approveResult = false;
          }
        }
        catch {
          approveResult = false;
        }
        this.approving = false;
        this.approved = approveResult;
      },
      async claimRewards() {
        this.claiming = true;
        let claimResult;
        try {
          claimResult = await this.$store.dispatch('depositWithPermit', BigNumber.from("0"));
        }
        catch {
          claimResult = false;
        }
        this.claiming = false;
      },
      async stake() {
        this.staking = true;
        let stakeResult;
        try {
          if (this.selectedToken.symbol == "ARCH") {
            stakeResult = await this.$store.dispatch('stakeWithPermit', this.amountToStake);
          }
          else if (this.selectedToken.symbol == "SLP") {
            stakeResult = await this.$store.dispatch('depositWithPermit', this.amountToStake);
          }
          else {
            console.log("debug::stake::selectedToken not found");
            stakeResult = false;
          }
        }
        catch (err) {
          stakeResult = false;
        }
        if (stakeResult) {
          this.amountToStake = null;
          this.onStakeInput(null);
        }
        this.staking = false;
      },
      async withdraw() {
        this.withdrawing = true;
        let withdrawResult;
        try {
          if (this.selectedToken.symbol == "ARCH") {
            withdrawResult = await this.$store.dispatch('withdraw', this.amountToUnstake);
          }
          else if (this.selectedToken.symbol == "SLP") {
            withdrawResult = await this.$store.dispatch('withdrawSLP', this.amountToUnstake);
          }
          else {
            console.log("debug::withdraw::selectedToken not found");
            withdrawResult = false;
          }
        }
        catch {
          withdrawResult = false;
        }
        if (withdrawResult) {
          this.amountToUnstake = null;
        }
        this.withdrawing = false;
      }
    },
  };
</script>
