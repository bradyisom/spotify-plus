import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';

import * as SpotifyWebApi from 'spotify-web-api-js';
import * as _ from 'lodash';

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
  private userId: string;

  constructor(
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      token: '',
      mixName: `My Mix Playlist`,
    });
  }

  public loadPlaylists() {
    this.spotify.setAccessToken(this.form.value.token);

    this.spotify.getMe().then((user) => {
      this.userId = user.id;
    });

    this.spotify.getUserPlaylists().then((playlists) => {
      this.form.addControl('playlists', this.formBuilder.array(_.map(playlists.items, (playlist) => {
        return this.formBuilder.group({
          id: playlist.id,
          name: playlist.name,
          trackCount: playlist.tracks.total,
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
}
