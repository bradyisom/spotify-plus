import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import {
  MatButtonModule, MatInputModule, MatCheckboxModule,
  MatIconModule, MatProgressBarModule, MatStepperModule,
  MatCardModule, MatTabsModule, MatListModule, MatSliderModule,
} from '@angular/material';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
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
    MatSliderModule,
    MatStepperModule,
    MatTabsModule,
    InfiniteScrollModule,
    RouterModule.forRoot(
      appRoutes,
      // { enableTracing: !environment.production }
    ),
    AngularFireModule.initializeApp({
      apiKey: 'AIzaSyCIIcFjibxE6aQwhC2rg4vgCq-O4hegqWM',
      authDomain: 'spotify-plus.firebaseapp.com',
      databaseURL: 'https://spotify-plus.firebaseio.com',
      projectId: 'spotify-plus',
      storageBucket: 'spotify-plus.appspot.com',
      messagingSenderId: '737874093570',
    }),
    AngularFirestoreModule.enablePersistence()
  ],
  providers: [ AuthGuard,
    UserLibraryService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
