import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { stakePoolInfo } from '@solana/spl-stake-pool';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { firstValueFrom } from 'rxjs';
import { ApiService, SolanaUtilsService, JupiterStoreService } from 'src/app/services';
import { StakePoolStoreService } from '../stake-pool-store.service';
import { StakePoolProvider, StakePoolStats } from '../stake-pool.model';
import { sol } from '@metaplex-foundation/js';

@Component({
  selector: 'app-liquid-staking-stats',
  templateUrl: './liquid-staking-stats.component.html',
  styleUrls: ['./liquid-staking-stats.component.scss'],
})
export class LiquidStakingStatsComponent implements OnChanges {
  @Output() onStakePoolStats: EventEmitter<StakePoolStats> = new EventEmitter();
  @Input() selectedProvider: StakePoolProvider;
  @Input() wallet
  public stakePoolStats: StakePoolStats = {
    assetRatio: null,
    supply: null,
    TVL: null,
    validators: null,
    userHoldings: null,
    apy: null
  };
  constructor(
    private _apiService: ApiService,
    private _solanaUtilsService: SolanaUtilsService,
    private _jupStore: JupiterStoreService,
    private _stakePoolStore: StakePoolStoreService,
  ) { }

  ngOnChanges(changes): void {
    this.stakePoolStats = {
      assetRatio: null,
      supply: null,
      TVL: null,
      validators: null,
      userHoldings: null,
      apy: null
    };
    this.fetchProviderStats();
  }
  async fetchProviderStats() {

    if (this.selectedProvider.poolName.toLowerCase() == 'marinade') {
      await this.fetchMarinadeStats()
    } else {
      await this.fetchPoolProviderStats()
    }
    await this.fetchUserHoldings();
    this.onStakePoolStats.emit(this.stakePoolStats);
  }

  async fetchPoolProviderStats() {
    let info = await stakePoolInfo(this._solanaUtilsService.connection, this.selectedProvider.poolPublicKey);
    let solprice = 0
    try {
     solprice =  await (await this._jupStore.fetchPriceFeed(info.poolMint)).data[info.poolMint].price;
    } 
    catch (err){
      solprice = 1.111
    }
    let solanaAmount = info.details.reserveStakeLamports;
    for (let i = 0; i < info.details.stakeAccounts.length; i++) {
      solanaAmount += parseInt(info.details.stakeAccounts[i].validatorLamports);
    }
    let tokenAmount = info.poolTokenSupply;
    let conversion = solanaAmount / Number(tokenAmount);

    try {
      const assetRatio = conversion
      const TVL = { staked_usd: solanaAmount / LAMPORTS_PER_SOL * solprice, staked_sol: solanaAmount / LAMPORTS_PER_SOL }
      const validators = info.validatorList.filter(validator => Number(validator.activeStakeLamports) / LAMPORTS_PER_SOL > 10).length//(await firstValueFrom(this._apiService.get('https://stake.solblaze.org/api/v1/validator_set'))).vote_accounts.length
      const supply = Number(tokenAmount) / LAMPORTS_PER_SOL
      // change blazestake name to solblaze as per solblaze request
      const stake_pool_data: any[] = this._stakePoolStore.providers.map(pool => {
        pool.poolName == 'BlazeStake' ? pool.poolName = 'SolBlaze' : null
        return pool
      }
      )

      const apy = stake_pool_data.find(pool => pool.poolName == this.selectedProvider.poolName).apy
      this.stakePoolStats = { assetRatio, TVL, validators, supply, apy };
    } catch (error) {
      console.error(error)
    }

  }

  async fetchMarinadeStats() {
    try {
      const assetRatio = await firstValueFrom(this._apiService.get('https://api.marinade.finance/msol/price_sol'))
      const mndeTVL = await firstValueFrom(this._apiService.get('https://api.marinade.finance/tlv'));
      const TVL = { staked_usd: mndeTVL.staked_usd, staked_sol: mndeTVL.staked_sol }
      const validators = 130;
      const supply = await firstValueFrom(this._apiService.get('https://api.marinade.finance/msol/supply')) / LAMPORTS_PER_SOL
      const apy = (await firstValueFrom(this._apiService.get('https://api.marinade.finance/msol/apy/30d'))).value * 100;
      this.stakePoolStats = { assetRatio, TVL, validators, supply, apy };
    } catch (error) {
      console.error(error)
    }
  }
  async fetchUserHoldings() {
    let TVL = { staked_usd: 0, staked_asset: 0 }
    try {
      const solprice = await (await this._jupStore.fetchPriceFeed('SOL')).data['SOL'].price;
      const splAccounts = await this._solanaUtilsService.getTokenAccountsBalance(this.wallet.publicKey) || [];
      const splAccount = splAccounts.find(account => account.mintAddress == this.selectedProvider.tokenMint.toBase58());
      TVL = { staked_usd: splAccount?.balance * solprice || 0, staked_asset: splAccount?.balance || 0 }
    } catch (error) {
      console.warn(error);
    }
    this.stakePoolStats.userHoldings = TVL
  }
}
