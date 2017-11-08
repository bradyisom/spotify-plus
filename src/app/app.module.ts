import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatInputModule, MatCheckboxModule,
  MatIconModule, MatProgressBarModule, MatStepperModule,
  MatCardModule, MatTabsModule, MatListModule,
} from '@angular/material';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';
import { UserLibraryService } from './user-library.service';
import { LibraryViewComponent } from './library-view/library-view.component';

const appRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'library', component: LibraryViewComponent },
  { path: '', pathMatch: 'full', component: LoginComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    LibraryViewComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressBarModule,
    MatStepperModule,
    MatTabsModule,
    RouterModule.forRoot(
      appRoutes,
      // { enableTracing: !environment.production }
    )
  ],
  providers: [ AuthGuard,
    UserLibraryService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
