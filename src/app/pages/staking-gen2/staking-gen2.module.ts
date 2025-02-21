import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StakingGen2PageRoutingModule } from './staking-gen2-routing.module';

import { StakingGen2Page } from './staking-gen2.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { MyGuardianComponent } from './my-guardian/my-guardian.component';
import { CrafterComponent } from './crafter/crafter.component';
import { StatsComponent } from './stats/stats.component';
import { PreviewComponent } from './my-guardian/preview/preview.component';
import { PerksTableComponent } from './my-guardian/perks-table/perks-table.component';
import { FaqComponent } from './crafter/faq/faq.component';
import { GeneratorComponent } from './crafter/generator/generator.component';
import { MyGuardianTumbComponent } from './crafter/my-guardian-tumb/my-guardian-tumb.component';
import { FormComponent } from './crafter/generator/form/form.component';

@NgModule({
  imports: [
    SharedModule,
    StakingGen2PageRoutingModule
  ],
  declarations: [
    StakingGen2Page,
    StatsComponent,
    MyGuardianComponent,
    PreviewComponent,
    PerksTableComponent,
    CrafterComponent,
    GeneratorComponent,
    MyGuardianTumbComponent,
    FormComponent,
    FaqComponent]
})
export class StakingGen2PageModule { }
