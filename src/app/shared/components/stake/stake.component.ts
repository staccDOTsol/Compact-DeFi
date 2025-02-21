import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { firstValueFrom, lastValueFrom, map, observable, Observable, Subscriber, switchMap } from 'rxjs';
import { Asset, ValidatorData } from 'src/app/models';
import { LoaderService, UtilsService, TxInterceptService, SolanaUtilsService } from 'src/app/services';
import { ActivatedRoute } from '@angular/router';

import va from '@vercel/analytics';


@Component({
  selector: 'app-stake',
  templateUrl: './stake.component.html',
  styleUrls: ['./stake.component.scss'],
})
export class StakeComponent implements OnInit {
  public wallet$ = this._solanaUtilsService.walletExtended$;
  @Input() validatorsData: Observable<ValidatorData[] | ValidatorData>;
  @Input() avgApy: number;
  @Input() privateValidatorPage: boolean = false;
  public showValidatorList: boolean = false;
  public stakeForm: FormGroup;
  public formSubmitted: boolean = false;
  public rewardInfo = {
    apy: 0,
    amount: 0
  }
  public selectedValidator: ValidatorData;
  public searchTerm = '';

  constructor(
    public loaderService: LoaderService,
    private _fb: FormBuilder,
    private _solanaUtilsService: SolanaUtilsService,
    private _txInterceptService: TxInterceptService,
    private _activeRoute: ActivatedRoute
  ) { }
  async ngOnInit() {

    this.stakeForm = this._fb.group({
      amount: ['', [Validators.required]],
      voteAccount: ['', [Validators.required]],
      // monthLockuptime: [0]
    })
    this.stakeForm.valueChanges.subscribe(form => {
      this.rewardInfo.amount = form.amount
    })

    const validatorData: any = await firstValueFrom(this.validatorsData);
    if (!this.privateValidatorPage) {
      this._activeRoute.queryParams
        .subscribe(params => {
          const validatorIdentity = params.validatorIdentity
          if (validatorIdentity) {
            this._preSelectValidator(validatorData, validatorIdentity);
          }
        }
        );
    } else {
      const myValidatorIdentity = validatorData.vote_identity
      validatorData.extraData['Support MEV'] = true;
      this._preSelectValidator([validatorData], myValidatorIdentity);
    }
  }

  public setMaxAmount(): void {
    const fixedAmount = this._solanaUtilsService.getCurrentWallet().balance - 0.0001
    this.stakeForm.controls.amount.setValue(fixedAmount);
  }

  private async _preSelectValidator(validators: ValidatorData[], validatorVoteKey: string) {
    // const validatorsList: ValidatorData[] | any = await firstValueFrom(this.validatorsData);
    const getSelectedValidator = validators.filter(validator => validator.vote_identity == validatorVoteKey)[0];
    this.setSelectedValidator(getSelectedValidator);
  }

  public setSelectedValidator(validator: ValidatorData): void {
    this.rewardInfo.apy = validator.apy_estimate

    this.selectedValidator = validator;

    this.stakeForm.controls.voteAccount.setValue(validator.vote_identity);
  }
  public async submitNewStake(): Promise<void> {


    let { amount, voteAccount } = this.stakeForm.value;
    const walletOwnerPublicKey = this._solanaUtilsService.getCurrentWallet().publicKey;
    // const testnetvoteAccount = '87QuuzX6cCuWcKQUFZFm7vP9uJ72ayQD5nr6ycwWYWBG'
    // if (monthLockuptime) {
    //   monthLockuptime = this._getLockuptimeMilisecond(monthLockuptime);
    // }
    await this._txInterceptService.delegate(amount * LAMPORTS_PER_SOL, walletOwnerPublicKey, voteAccount);
    va.track(`stake with ${voteAccount}`);
  }
  // private _getLockuptimeMilisecond(months: number): number {
  //   const lockupDateInSecond = new Date((new Date).setMonth((new Date).getMonth() + months)).getTime();
  //   const unixTime = Math.floor(lockupDateInSecond / 1000);
  //   return unixTime;
  // }
}
