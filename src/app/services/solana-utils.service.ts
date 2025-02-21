import { Injectable } from '@angular/core';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import { AccountInfo, clusterApiUrl, ConfirmedSignatureInfo, Connection, GetProgramAccountsFilter, LAMPORTS_PER_SOL, ParsedAccountData, PublicKey, StakeActivationData, Transaction } from '@solana/web3.js';
import { BehaviorSubject, firstValueFrom, Observable, Subject, throwError } from 'rxjs';
import { catchError, combineLatestWith, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { TOKEN_PROGRAM_ID } from '../../../node_modules/@solana/spl-token';
import { ApiService, UtilsService, ToasterService } from './';
import { ValidatorData, StakeAccountExtended, TokenBalance, WalletExtended } from '../models';
import { PopoverController } from '@ionic/angular';


interface jitoValidators {
  vote_account: string,
  mev_commission_bps: 800,
  running_jito: true
}
interface StakeWizEpochInfo {
  epoch: number,
  start_slot: number,
  start_time: Date,
  slot_height: number,
  duration_seconds: number,
  elapsed_seconds: number,
  remaining_seconds: number,
  epochs_per_year: number,
  timepassInPercentgae?: number,
  ETA?: string;
}
@Injectable({
  providedIn: 'root'
})
export class SolanaUtilsService {
  public connection: Connection;
  public accountChange$ = new BehaviorSubject({});
  private validatorsData: ValidatorData[];
  private _stakeAccounts$: BehaviorSubject<StakeAccountExtended[]> = new BehaviorSubject(null as StakeAccountExtended[]);
  public stakeAccounts$ = this._stakeAccounts$.asObservable();

  // create a single source of trute for wallet adapter
  private _walletExtended$: BehaviorSubject<WalletExtended> = new BehaviorSubject(null as WalletExtended);

  // add balance utility
  public walletExtended$ = this._walletExtended$.asObservable().pipe(
    
    combineLatestWith(this.accountChange$),
    // accountStateChange used as trigger for re-render wallet related context
    switchMap(async ([wallet, accountStateChange]: any) => {
      if (wallet) {
        wallet.balance = ((await this.connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL);
      }
      return wallet;
    }),
    shareReplay(1),
  )

  constructor(
    private _apiService: ApiService,
    private _toasterService: ToasterService,
    private _connectionStore: ConnectionStore,
    private _utilService: UtilsService,
    public popoverController: PopoverController,
    private _walletStore: WalletStore
  ) {
    this._connectionStore.connection$.subscribe(conection => this.connection = conection);
    this._walletStore.anchorWallet$.subscribe(wallet => this._walletExtended$.next(wallet));
  }
  public getCurrentWallet(): WalletExtended {
    return this._walletExtended$.value
  }
  public onAccountChangeCB(walletOwnerPk: PublicKey): void {
    this.connection.onAccountChange(walletOwnerPk, async (ev) => {
      this.accountChange$.next(ev);
    });
  }
  public getStakeAccountsExtended() {
    return this._stakeAccounts$.value;
  }

  private _formatErrors(error: any) {
    console.warn('my err', this._toasterService)
    this._toasterService.msg.next({
      message: error.message,
      segmentClass: "toastError",
    });
    return throwError((() => error))
  }

  public async fetchMevValidators(): Promise<jitoValidators[]> {
    try {
      const fetchValidatorsList = await fetch('https://kobe.mainnet.jito.network/api/v1/validators');
      const resValidatorList = await fetchValidatorsList.json();
      const runningJito = resValidatorList.validators.filter(validator => validator.running_jito);
      return runningJito
    } catch (error) {
      console.warn(error);
      return []
    }
  }
  public getValidatorData(vote_identity?: string): Observable<ValidatorData | ValidatorData[]> {
    const prefixPath = vote_identity ? `validator/${vote_identity}` : 'validators'
    const stakewizeAPI = 'https://api.stakewiz.com/' + prefixPath
    return this._apiService.get(stakewizeAPI).pipe(
      map(data => {
        let result;
        if (vote_identity) {
          result = {
            name: data.name || '',
            image: data.image || '/assets/images/icons/node-placeholder.svg',
            vote_identity: data.vote_identity,
            website: data.website,
            wizScore: data.wiz_score,
            commission: data.commission,
            apy_estimate: data.apy_estimate,
            activated_stake: data.activated_stake,
            uptime: data.uptime,
            selectable: true,
            extraData: {
              'APY estimate': data.apy_estimate + '%',
              commission: data.commission + '%'
            },
          }
        } else {

          result = data.map(validator => {

            return {
              name: validator.name || '',
              image: validator.image || '/assets/images/icons/node-placeholder.svg',
              vote_identity: validator.vote_identity,
              website: validator.website,
              wizScore: validator.wiz_score,
              commission: validator.commission,
              apy_estimate: validator.apy_estimate,
              activated_stake: data.activated_stake,
              uptime: validator.uptime,
              selectable: true,
              extraData: {
                'APY estimate': validator.apy_estimate + '%',
                commission: validator.commission + '%'
              }
            }
          })
          this.validatorsData = result;
        }
        return result;
      }),
      catchError(this._formatErrors)
    );
  }
  public getAvaultoStakeChange(){
    return this._apiService.get(`https://api.stakewiz.com/validator_epoch_stakes/7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh`).pipe(
      map((stake) => {
        return stake
      }),
      catchError(this._formatErrors)
    );
  }
  public getAvgApy() {
    return this._apiService.get(`https://api.stakewiz.com/cluster_stats`).pipe(
      map((clusterInfo) => {
        const { avg_apy } = clusterInfo;

        return avg_apy
      }),
      catchError(this._formatErrors)
    );
  }



  public async getStakeAccountsByOwner(publicKey: PublicKey): Promise<Array<{
    pubkey: PublicKey;
    account: AccountInfo<Buffer | ParsedAccountData | any>;
  }> | any> {
    try {

      // get stake account
      const stakeAccounts: Array<{
        pubkey: PublicKey;
        account: AccountInfo<Buffer | ParsedAccountData | any>;
      }> = await this.connection.getParsedProgramAccounts(new PublicKey("Stake11111111111111111111111111111111111111"), {

        "filters": [
          {
            "memcmp": {
              "offset": 12,
              "bytes": publicKey.toBase58()
            }
          }
        ]
      })


      return stakeAccounts;
    } catch (error) {
      return new Error(error)
    }
    // return [];
  }
  public async findAssociatedTokenAddress(
    walletAddress: PublicKey,
    tokenMintAddress: PublicKey
  ): Promise<PublicKey> {
    const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    );
    return (await PublicKey.findProgramAddressSync(
      [
        walletAddress.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        tokenMintAddress.toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    ))[0];
  }
  public async extendStakeAccount(account: { pubkey: PublicKey; account: AccountInfo<Buffer | ParsedAccountData | any> }): Promise<any> {
    const pk = account.pubkey;
    const addr = pk.toBase58()

    const parsedData = account.account.data.parsed.info.stake || null//.delegation.stake
    const validatorVoteKey = parsedData?.delegation?.voter
    const stake = Number(parsedData?.delegation?.stake) || 0;
    const startEpoch = parsedData.delegation.activationEpoch;
    const rentReseve = Number(account.account.data.parsed.info.meta.rentExemptReserve);
    const accountLamport = Number(account.account.lamports);
    const excessLamport = accountLamport - stake - rentReseve
    const { active, state }: StakeActivationData = await this.connection.getStakeActivation(pk);
    let validatorData: ValidatorData | any = null;
    if (this.validatorsData) {
      validatorData = this.validatorsData.filter(validator => validator.vote_identity == validatorVoteKey)[0];
    } else {
      try {
        validatorData = (await firstValueFrom(this.getValidatorData(validatorVoteKey)))
      } catch (error) {
        console.warn(error)
      }
    }


    const stakeAccountInfo: StakeAccountExtended = {
      addr,
      shortAddr: this._utilService.addrUtil(addr).addrShort,
      balance: this._utilService.shortenNum(Number((stake / LAMPORTS_PER_SOL)), 3),
      state,
      validatorData,
      validatorVoteKey,
      excessLamport,
      checkedForMerge: false,
      startEpoch,
      canMerge: true
    }
    return stakeAccountInfo
  }

  public async fetchAndUpdateStakeAccount(publicKey: PublicKey) {
    const stakeAccounts = await this.getStakeAccountsByOwner(publicKey);
    const extendStakeAccount = await stakeAccounts.map(async (acc) => {
      return await this.extendStakeAccount(acc)
    })
    const extendStakeAccountRes = await Promise.all(extendStakeAccount);
    this._stakeAccounts$.next(extendStakeAccountRes);
  }



  public async getSupply(): Promise<{ circulating: any, noneCirculating: any }> {
    const supply = await this.connection.getSupply();
    const circulating = this._utilService.numFormater(supply.value.circulating / LAMPORTS_PER_SOL)
    const noneCirculating = this._utilService.numFormater(supply.value.nonCirculating / LAMPORTS_PER_SOL)
    return { circulating, noneCirculating }
  }
  public async getStake(): Promise<{ activeStake, delinquentStake }> {
    const stakeInfo = await this.connection.getVoteAccounts()
    const activeStake = this._utilService.numFormater(stakeInfo.current.reduce(
      (previousValue, currentValue) => previousValue + currentValue.activatedStake,
      0
    ) / LAMPORTS_PER_SOL)
    const delinquentStake = this._utilService.numFormater(stakeInfo.delinquent.reduce(
      (previousValue, currentValue) => previousValue + currentValue.activatedStake,
      0
    ) / LAMPORTS_PER_SOL)
    return { activeStake, delinquentStake }
  }
  public async getTPS(): Promise<any> {
    const performaceRes = (await this.connection.getRecentPerformanceSamples())[0];
    const tps = performaceRes.numTransactions / performaceRes.samplePeriodSecs

    return tps
  }
  public getEpochInfo(): Observable<StakeWizEpochInfo> {
    return this._apiService.get(`https://api.stakewiz.com/epoch_info`).pipe(
      map((data: StakeWizEpochInfo) => {
        const { remaining_seconds, elapsed_seconds, duration_seconds } = data
        const days = Math.floor(remaining_seconds / 86400);
        const hours = Math.floor(remaining_seconds / 3600) - (days * 24);
        data.ETA = `ETA ${days} Days and ${hours} Hours`
        data.timepassInPercentgae = elapsed_seconds / duration_seconds
        return data
      }),
      catchError(this._formatErrors)
    );
  }
  async getWalletHistory(walletPubKey: PublicKey) {
    // try {
    //   const signatures: ConfirmedSignatureInfo[] = await this.connection.getConfirmedSignaturesForAddress2(walletPubKey);
    //   let records: any[] = [];
    //   let walletHistory = []
    //   signatures.forEach(async signature => {
    //     const txInfo = await this.connection.getTransaction(signature.signature);
    //     records.push(txInfo);
    //   });
    //   records.forEach((record, i) => {
    //     const from = record?.transaction?.instructions[0]?.keys[0]?.pubkey.toBase58() || null;
    //     const to = record.transaction?.instructions[0]?.keys[1]?.pubkey.toBase58() || null;;
    //     const amount = (record.meta?.postBalances[1] - record.meta?.preBalances[1]) / LAMPORTS_PER_SOL || null;
    //     walletHistory.push({ signature: signatures[i].signature, block: record.slot, amount, from, to } || null)
    //   });
    //   return walletHistory;
    // } catch (error) {
    //   console.error(error)
    //   this._toasterService.msg.next({ message: 'failed to retrieve transaction history', icon: '', segmentClass: 'toastError' })
    // }
  }

  public async getTokenAccountsBalance(wallet: string, getType?: 'token' | 'nft'): Promise<TokenBalance[]> {
    const filters: GetProgramAccountsFilter[] = [
      {
        dataSize: 165,    //size of account (bytes)
      },
      {
        memcmp: {
          offset: 32,     //location of our query in the account (bytes)
          bytes: wallet,  //our search criteria, a base58 encoded string
        }
      }
    ];
    const accounts = await this.connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,   //SPL Token Program, new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      { filters }
    );
    let tokensBalance: TokenBalance[] = accounts.map((account, i) => {
      //Parse the account data
      const parsedAccountInfo: any = account.account.data;
      const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
      const balance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
      const decimals: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["decimals"];
      return { tokenPubkey: account.pubkey.toString(), mintAddress, balance, decimals }
    })
    if (getType) {
      if (getType == 'nft') {
        tokensBalance = tokensBalance.filter(token => token.decimals == 0)
      } else if (getType == 'token') {
        tokensBalance = tokensBalance.filter(token => token.decimals != 0)
      }
    }
    return tokensBalance;

  }
}
