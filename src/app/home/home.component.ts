import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as SpotifyWebApi from 'spotify-web-api-js';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public form: FormGroup;
  public newPlaylistInfo: any = {
    originalPlaylists: [],
    uniqueTracks: [],
    playlist: null,
    loaded: false,
  };

  private spotify = new SpotifyWebApi();
  private hashParams: any;
  private userId: string;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    this.getHashParams();

    const storedState = localStorage.getItem('login-state');
    const state = this.hashParams['state'];
    const token = this.hashParams['access_token'];
    const expires = +this.hashParams['expires_in'];

    if (token && (!state || state !== storedState)) {
      // alert('There was an error during authentication');
      this.router.navigate(['/']);
    } else {
      localStorage.removeItem('login-state');
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpires', moment().add(expires, 'seconds').toISOString());
      this.spotify.setAccessToken(token);

      this.form = this.formBuilder.group({
        mixName: `My Mix Playlist`,
      });

      this.loadPlaylists();
    }
  }

  public loadPlaylists() {
    this.spotify.getMe().then((user) => {
      this.userId = user.id;
    });

    const playlists: any[] = [];
    this.getPlaylists(playlists).then(() => {
      this.form.addControl('playlists', this.formBuilder.array(_.map(_.flatten(playlists), (playlist) => {
        let owner = 'Me';
        if (playlist.owner.id !== this.userId) {
          owner = playlist.owner.display_name ? playlist.owner.display_name : playlist.owner.id;
        }
        return this.formBuilder.group({
          id: playlist.id,
          name: playlist.name,
          trackCount: playlist.tracks.total,
          owner: owner,
          include: false
        });
      })));
    });
  }

  get playlists(): FormArray {
    return this.form.get('playlists') as FormArray;
  }

  public createMix() {
    this.newPlaylistInfo = {
      originalPlaylists: []
    };

    let tracks: any[] = [];
    const trackPromises = _.map(_.filter(this.playlists.controls, (playlist) => {
      return playlist.value.include;
    }), (playlist) => {
      this.newPlaylistInfo.originalPlaylists.push(playlist.value);
      return this.getTracks(tracks, playlist.value.id);
    });

    let newId: string;
    Promise.all(trackPromises).then(() => {
      this.newPlaylistInfo.uniqueTracks = _.uniq(_.flatten(tracks));
      tracks = _.shuffle(this.newPlaylistInfo.uniqueTracks);
      return this.spotify.createPlaylist(this.userId, {
        name: this.form.get('mixName').value
      });
    }).then((newPlaylist) => {
      newId = newPlaylist.id;
      const trackGroups = _.chunk(tracks, 100);
      let promise = this.spotify.addTracksToPlaylist(this.userId, newId, trackGroups[0]);
      _.slice(trackGroups, 1).forEach((group) => {
        promise = promise.then(() => {
          return this.spotify.addTracksToPlaylist(this.userId, newId, group);
        });
      });
      return promise;
    }).then(() => {
      return this.spotify.getPlaylist(this.userId, newId);
    }).then((newPlaylist) => {
      this.newPlaylistInfo.playlist = newPlaylist;
      this.newPlaylistInfo.loaded = true;
    });
  }

  private getPlaylists(playlists: any[], offset = 0): Promise<any> {
    return this.spotify.getUserPlaylists(this.userId, {
      offset: offset,
      limit: 50
    }).then((playlistChunk) => {
      playlists.splice(playlists.length, 0, playlistChunk.items);
      if (playlistChunk.total > (offset + playlistChunk.limit)) {
        return this.getPlaylists(playlists, offset + playlistChunk.limit);
      }
    });
  }

  private getTracks(tracks: any[], playlistId: string, offset = 0): Promise<any> {
    return this.spotify.getPlaylistTracks(this.userId, playlistId, {
      offset: offset
    }).then((playlistTracks) => {
      tracks.splice(tracks.length, 0, _.map(playlistTracks.items, track => track.track.uri));
      if (playlistTracks.total > (offset + 100)) {
        return this.getTracks(tracks, playlistId, offset + 100);
      }
    });
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
