import { Injectable } from '@angular/core';

import * as SpotifyWebApi from 'spotify-web-api-js';
import * as _ from 'lodash';
import * as moment from 'moment';

@Injectable()
export class UserLibraryService {
  public user: any;

  public playlists: any[];
  public playlistCount = 0;
  public playlistsLoaded = 0;

  public tracks: any[];
  public trackCount = 0;
  public tracksLoaded = 0;

  public albumHash: any;
  public albums: any[];
  public albumCount = 0;
  public albumsLoaded = 0;

  public artistHash: any;
  public artists: any[];
  public artistCount = 0;
  public artistsLoaded = 0;

  public genreHash: any;
  public genreCount = 0;

  public loading = false;
  public loaded = false;

  public creatingPlaylist = false;
  public createdPlaylist = false;

  public uniqueTracks: any[] = [];
  public newPlaylist: any;

  private spotify = new SpotifyWebApi();

  constructor() { }

  public loadUser() {
    this.spotify.getMe().then((user) => {
      this.user = user;
    });
  }

  public loadLibrary() {
    this.loading = true;
    this.playlists = [];
    this.playlistCount = 0;
    this.playlistsLoaded = 0;
    this.tracks = [];
    this.trackCount = 0;
    this.tracksLoaded = 0;
    this.albumHash = {};
    this.albums = [];
    this.albumCount = 0;
    this.albumsLoaded = 0;
    this.artistHash = {};
    this.artists = [];
    this.artistCount = 0;
    this.artistsLoaded = 0;
    this.genreHash = {};
    this.genreCount = 0;
    const tracks: any[] = [];
    this.loadUserPlaylists().then(() => {
      this.playlists = _.flatten(this.playlists);
      console.log('playlists', this.playlists);
      return this.loadUserTracks();
    }).then(() => {
      this.tracks = _.flatten(this.tracks);
      console.log('tracks', this.tracks);
      console.log('albumHash', Object.keys(this.albumHash).length, this.albumHash);
      return this.loadUserAlbums();
    }).then(() => {
      this.albums = _.flatten(this.albums);
      console.log('albums', this.albums);
      console.log('artistHash', Object.keys(this.artistHash).length, this.artistHash);
      return this.loadUserArtists();
    }).then(() => {
      this.artists = _.flatten(this.artists);
      console.log('artists', this.artists);
      console.log('genreHash', Object.keys(this.genreHash).length, this.genreHash);
    }).then(() => {
      this.loaded = true;
      console.log('tracks', this.tracks);
      console.log('DONE');
    });
  }

  private loadUserPlaylists(offset = 0): Promise<any> {
    return this.spotify.getUserPlaylists(this.user.id, {
      offset: offset,
      limit: 50
    }).then((playlistChunk) => {
      this.playlistCount = playlistChunk.total;
      this.playlistsLoaded += playlistChunk.items.length;
      playlistChunk.items.forEach((playlist) => {
        (<any>playlist).ownerDisplay = playlist.owner.display_name ? playlist.owner.display_name : playlist.owner.id;
      });
      this.playlists.splice(this.playlists.length, 0, playlistChunk.items);
      if (playlistChunk.total > (offset + playlistChunk.limit)) {
        return this.loadUserPlaylists(offset + playlistChunk.limit);
      }
    });
  }

  private loadUserTracks(offset = 0): Promise<any> {
    return this.spotify.getMySavedTracks({
      offset: offset,
      limit: 50,
    }).then((trackChunk) => {
      this.trackCount = trackChunk.total;
      this.tracksLoaded += trackChunk.items.length;
      this.tracks.splice(this.tracks.length, 0,
        _.map(trackChunk.items, track => {
          (<any>track.track).added_at = track.added_at;
          return track.track;
        })
      );
      trackChunk.items.forEach((track) => {
        const albumId = track.track.album.id;
        if (!this.albumHash[albumId]) {
          this.albumCount += 1;
          this.albumHash[albumId] = [track.track];
        } else {
          this.albumHash[albumId].push(track.track);
        }
      });
      if (offset <= 100 &&
          trackChunk.total > (offset + trackChunk.limit)) {
        return this.loadUserTracks(offset + trackChunk.limit);
      }
    });
  }

  private loadUserAlbumGroup(group: any) {
    this.albumsLoaded += group.albums.length;
    this.albums.splice(this.albums.length, 0, group.albums);
    group.albums.forEach((album: any) => {
      const trackList = this.albumHash[album.id];
      trackList.forEach((track) => {
        track.album = album;
      });
      album.tracks = trackList;
      album.artists.forEach((artist) => {
        if (!this.artistHash[artist.id]) {
          this.artistCount += 1;
          this.artistHash[artist.id] = [album];
        } else {
          this.artistHash[artist.id].push(album);
        }
      });
    });
  }

  private loadUserAlbums(offset = 0): Promise<any> {
    const albumGroups = _.chunk(Object.keys(this.albumHash), 20);
    let promise = this.spotify.getAlbums(albumGroups[0]).then((groupResult: any) => {
      this.loadUserAlbumGroup(groupResult);
    });
    _.slice(albumGroups, 1).forEach((group) => {
      promise = promise.then(() => {
        return this.spotify.getAlbums(group).then((groupResult: any) => {
          this.loadUserAlbumGroup(groupResult);
        });
      });
    });
    return promise;
  }

  private loadUserArtistGroup(group: any) {
    this.artistsLoaded += group.artists.length;
    this.artists.splice(this.artists.length, 0, group.artists);
    group.artists.forEach((artist: any) => {
      const albums = this.artistHash[artist.id];
      artist.albums = albums;
      artist.genres.forEach((genre) => {
        if (!this.genreHash[genre]) {
          this.genreCount += 1;
          this.genreHash[genre] = [artist];
        } else {
          this.genreHash[genre].push(artist);
        }
      });
    });
  }

  private loadUserArtists(offset = 0): Promise<any> {
    const artistGroups = _.chunk(Object.keys(this.artistHash), 50);
    let promise = this.spotify.getArtists(artistGroups[0]).then((groupResult: any) => {
      this.loadUserArtistGroup(groupResult);
    });
    _.slice(artistGroups, 1).forEach((group) => {
      promise = promise.then(() => {
        return this.spotify.getArtists(group).then((groupResult: any) => {
          this.loadUserArtistGroup(groupResult);
        });
      });
    });
    return promise;
  }

  public createMix(name: string, options: {
    playlists?: any[]
  }): Promise<any> {
    this.creatingPlaylist = true;

    let tracks: any[] = [];
    const trackPromises = _.map(options.playlists, (playlist) => {
      return this.getTracks(tracks, playlist.id);
    });

    let newId: string;
    return Promise.all(trackPromises).then(() => {
      this.uniqueTracks = _.uniq(_.flatten(tracks));
      tracks = _.shuffle(this.uniqueTracks);
      return this.spotify.createPlaylist(this.user.id, {
        name: name
      });
    }).then((newPlaylist) => {
      newId = newPlaylist.id;
      const trackGroups = _.chunk(tracks, 100);
      let promise = this.spotify.addTracksToPlaylist(this.user.id, newId, trackGroups[0]);
      _.slice(trackGroups, 1).forEach((group) => {
        promise = promise.then(() => {
          return this.spotify.addTracksToPlaylist(this.user.id, newId, group);
        });
      });
      return promise;
    }).then(() => {
      return this.spotify.getPlaylist(this.user.id, newId);
    }).then((newPlaylist) => {
      this.newPlaylist = newPlaylist;
      this.createdPlaylist = true;
    });
  }

  private getTracks(tracks: any[], playlistId: string, offset = 0): Promise<any> {
    return this.spotify.getPlaylistTracks(this.user.id, playlistId, {
      offset: offset
    }).then((playlistTracks) => {
      tracks.splice(tracks.length, 0, _.map(playlistTracks.items, track => track.track.uri));
      if (playlistTracks.total > (offset + 100)) {
        return this.getTracks(tracks, playlistId, offset + 100);
      }
    });
  }

  public reset() {
    this.creatingPlaylist = false;
    this.createdPlaylist = false;

    this.uniqueTracks = [];
    this.newPlaylist = undefined;

  }
}
