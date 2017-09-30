import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatInputModule, MatCheckboxModule, MatIconModule } from '@angular/material';
import { MATERIAL_COMPATIBILITY_MODE } from '@angular/material';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';

const appRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: '**', component: LoginComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: !environment.production }
    )
  ],
  providers: [ AuthGuard,
    { provide: MATERIAL_COMPATIBILITY_MODE, useValue: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
