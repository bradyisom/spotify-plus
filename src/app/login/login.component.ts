import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import * as moment from 'moment';
import * as _ from 'lodash';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public loggingIn = false;

  private hashParams: any;

  constructor(
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
  ) { }

  ngOnInit() {
    this.getHashParams();

    const storedState = localStorage.getItem('login-state');
    const state = this.hashParams['state'];
    const token = this.hashParams['access_token'];
    const expires = +this.hashParams['expires_in'];

    if (token && (state && state === storedState)) {
      localStorage.removeItem('login-state');
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpires', moment().add(expires, 'seconds').toISOString());
      this.loggingIn = true;
      this.auth.login(token);
    } else {
      const existingToken = localStorage.getItem('token');
      const existingExpires = localStorage.getItem('tokenExpires');
      if (existingToken && moment(existingExpires).isAfter(moment())) {
        this.loggingIn = true;
        this.auth.login(existingToken);
      }
    }
  }

  public login() {
    const clientId = '2fb20822b54449f5b637433a97affe78';
    const state = _.random(0, 1, true).toString();
    const scope = [
      'user-read-private',
      'user-library-read',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ].join(' ');
    const redirectUri = `${window.location.origin}`;

    localStorage.setItem('login-state', state);

    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(clientId);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirectUri);
    url += '&state=' + encodeURIComponent(state);

    window.location.assign(url);
  }

  private getHashParams() {
    const subscription = this.route.fragment.subscribe((fragment: string) => {
      let e: RegExpExecArray;
      const r = /([^&;=]+)=?([^&;]*)/g;
      this.hashParams = {};
      while (e = r.exec(fragment)) {
        this.hashParams[e[1]] = decodeURIComponent(e[2]);
      }
    });
    subscription.unsubscribe();
  }

}
