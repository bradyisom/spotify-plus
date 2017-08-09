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
  public newPlaylist: any;

  private spotify = new SpotifyWebApi();
  private userId: string;

  constructor(
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      token: '',
      mixName: `My mix playlist`,
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
          include: false
        });
      })));
      // this.playlists = playlists.items;
    });
  }

  get playlists(): FormArray {
    return this.form.get('playlists') as FormArray;
  }

  public createMix() {
    let tracks: any[] = [];

    const trackPromises = _.map(_.filter(this.playlists.controls, (playlist) => {
      return playlist.value.include;
    }), (playlist) => {
      return this.getTracks(tracks, playlist.value.id);
    });

    let newId: string;
    Promise.all(trackPromises).then(() => {
      tracks = _.uniq(_.shuffle(_.flatten(tracks)));
      return this.spotify.createPlaylist(this.userId, {
        name: this.form.get('mixName').value
      });
    }).then((newPlaylist) => {
      newId = newPlaylist.id;
      const trackGroups = _.chunk(tracks, 100);
      let promise = this.addTrackGroup(newId, trackGroups[0]);
      _.slice(trackGroups, 1).forEach((group) => {
        promise = this.addTrackGroup(newId, group);
      });
      return promise;
    }).then(() => {
      return this.spotify.getPlaylist(this.userId, newId);
    }).then((newPlaylist) => {
      this.newPlaylist = newPlaylist;
    });
  }

  private getTracks(tracks: any[], playlistId: string, offset = 0): Promise<any> {
    return this.spotify.getPlaylistTracks(this.userId, playlistId, {
      offset: offset
    }).then((playlistTracks) => {
      tracks.splice(tracks.length, 0, _.map(playlistTracks.items, track => track.track.id));
      if (playlistTracks.total > (offset + 100)) {
        return this.getTracks(tracks, playlistId, offset + 100);
      }
    });
  }

  private addTrackGroup(playlistId, group): Promise<any> {
    return this.spotify.addTracksToPlaylist(this.userId, playlistId, _.map(group, (track) => {
      return `spotify:track:${track}`;
    }));
  }
}
