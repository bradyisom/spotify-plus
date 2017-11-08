import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import * as _ from 'lodash';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    private location: Location,
  ) { }

  ngOnInit() {
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
    const redirectUri = `${window.location.origin}/home`;

    localStorage.setItem('login-state', state);

    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(clientId);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirectUri);
    url += '&state=' + encodeURIComponent(state);

    window.location.assign(url);
  }

}
