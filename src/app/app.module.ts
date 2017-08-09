import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MdButtonModule, MdInputModule, MdCheckboxModule, MdIconModule } from '@angular/material';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

const appRoutes: Routes = [
  { path: '**', component: HomeComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MdButtonModule,
    MdInputModule,
    MdCheckboxModule,
    MdIconModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: !environment.production }
    )
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
