import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreModule } from '@ngrx/store';

import { STORE_FEATURES } from '@core/consts';
import { LeftSidebarComponent, MainComponent, NavigationComponent, RightSidebarComponent } from './components';
import { MainRoutingModule } from './main-routing.module';
import { mainReducer } from './store';

@NgModule({
  declarations: [MainComponent, NavigationComponent, LeftSidebarComponent, RightSidebarComponent],
  imports: [
    CommonModule,
    MainRoutingModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    StoreModule.forFeature(STORE_FEATURES.main, mainReducer),
  ],
})
export class MainModule {}
