import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-defi-tour',
  templateUrl: './defi-tour.component.html',
  styleUrls: ['./defi-tour.component.scss'],
})
export class DefiTourComponent implements OnInit {
  defiTour = [{
    title: 'welcome to decentralized finance',
    description: `Decentralized finance (DeFi) is a new type of finance that can be created,
     exchanged and traded without intermediary intermediaries such as exchange, brokerages and banks.`,
  },
  {
    title: 'how Defi works',
    description: `DeFi is open-source, decentralized financial infrastructure that utilizes technology like smart contracts and decentralized exchanges to create products for investing, lending, borrowing and more.
     It aims to promote financial inclusion and democratize ownership of assets by anyone with a computer.`,
  },
  {
    title: 'Why Compact-DeFi',
    description: `We have been reviewing a variety of DeFi applications to find the best fit for our platform. 
    Our goal is to provide you with seamless and permissionless access to a new generation of finance.`,

  },
  {
    title: 'DYOR',
    description: `Unleashing the true potential of DeFi, we've scoured the market to bring you the cream of the crop in terms of apps. However, as with any technology, there's always the possibility of bugs or malicious activity from third parties. Keep in mind, the operators of these apps have the ultimate authority to change their functionality. But don't just take our word for it - always remember to DYOR (Do Your Own Research) before diving in.`,
    button: 'see apps',
  }

  ]
  slideOpts = {
    initialSlide: 0,
    slidesPerView: 1,
    speed: 400
  };
  constructor(private _popoverController: PopoverController) { }

  ngOnInit() { }
  public closePopup(): void {
    this._popoverController.dismiss()
  }
}
