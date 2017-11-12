import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { AngularFireAuth } from 'angularfire2/auth';
import * as SpotifyWebApi from 'spotify-web-api-js';

@Injectable()
export class AuthService implements CanActivateChild {

  public spotify = new SpotifyWebApi();
  public user: any;

  private subscription: Subscription;

  constructor(
    private router: Router,
    private http: HttpClient,
    private afAuth: AngularFireAuth,
  ) {}

  public login(spotifyToken: string) {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    console.log('login', spotifyToken);

    this.spotify.setAccessToken(spotifyToken);

    return this.spotify.getMe().then((user) => {
      this.user = user;
      const headers = new HttpHeaders();
      headers.append('Content-Type', 'application/json');
      return this.http.post(`https://us-central1-spotify-plus.cloudfunctions.net/token`, {
        id: user.id
      }, {
        headers: headers
      }).toPromise();
    }).then((data: any) => {
      if (data.token) {
        this.subscription = this.afAuth.authState.subscribe((user: any) => {
          // console.log('auth event', user);
          if (user) {
            this.router.navigate(['/home']);
          }
        });
        return this.afAuth.auth.signInWithCustomToken(data.token);
      } else {
        return Promise.reject(`Error authenticating: ${data.error.toString()}`);
      }
    }).catch((error: any) => {
      this.afAuth.auth.signOut();
      console.log('Unable to login', error);
    });
  }

  canActivateChild(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const loggedIn = !!this.afAuth.auth.currentUser;
    if (!loggedIn) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}
