import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { MatSnackBar } from '@angular/material';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/do';

import * as SpotifyWebApi from 'spotify-web-api-js';
import * as _ from 'lodash';
import * as moment from 'moment';

import { AuthService } from './auth.service';

@Injectable()
export class UserLibraryService {
  public user: any;

  private _playlists: any[];
  public playlistCount = 0;
  public playlistsLoaded = 0;

  private _tracks: any[];
  public trackCount = 0;
  public tracksLoaded = 0;

  private _albumHash: any;
  private _albums: any[];
  public albumCount = 0;
  public albumsLoaded = 0;

  private _artistHash: any;
  private _artists: any[];
  public artistCount = 0;
  public artistsLoaded = 0;

  private _genreHash: any;
  public genreCount = 0;

  public initialized = false;
  public loading = false;
  public loaded = false;

  public creatingPlaylist = false;
  public createdPlaylist = false;

  public uniqueTracks: string[] = [];
  public newPlaylistMinutes = 0;
  public newPlaylist: any;

  private spotify = new SpotifyWebApi();

  private userDataDoc: AngularFirestoreDocument<any>;

  private _playlistOffset = 0;
  // private _playlistPageSize = 15;
  private _playlistPageSize = 50;
  private _playlistsLoading = false;
  private _playlistsDone = false;
  private _playlistCollection = new BehaviorSubject<any>([]);
  private playlistCollection: AngularFirestoreCollection<any>;

  private trackCollection: AngularFirestoreCollection<any>;
  private albumCollection: AngularFirestoreCollection<any>;
  private artistCollection: AngularFirestoreCollection<any>;
  private genreCollection: AngularFirestoreCollection<any>;
  private mixesCollection: AngularFirestoreCollection<any>;

  public playlists: Observable<any>;
  public tracks: Observable<any>;
  public albums: Observable<any>;
  public artists: Observable<any>;
  public genres: Observable<any>;
  public mixes: Observable<any>;

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService,
    private snackBar: MatSnackBar,
  ) { }

  public loadUser() {
    this.user = this.auth.user;
    this.userDataDoc = this.afs.doc(`/users/${this.user.id}`);
    this.userDataDoc.set(this.user);

    this.playlistCollection = this.userDataDoc.collection('playlists', ref => ref.orderBy('index'));
    this.playlists = this._playlistCollection.asObservable().
      scan((acc, val) => acc.concat(val));

    this.trackCollection = this.userDataDoc.collection('tracks', ref => ref.orderBy('added_at'));
    this.tracks = this.trackCollection.valueChanges();
    this.albumCollection = this.userDataDoc.collection('albums', ref => ref.orderBy('release_date', 'desc'));
    this.albums = this.albumCollection.valueChanges();
    this.artistCollection = this.userDataDoc.collection('artists', ref => ref.orderBy('name'));
    this.artists = this.artistCollection.valueChanges();
    this.genreCollection = this.userDataDoc.collection('genres', ref => ref.orderBy('name'));
    this.genres = this.genreCollection.valueChanges();

    this.mixesCollection = this.userDataDoc.collection('mixes', ref => ref.orderBy('name'));
    this.mixes = this.mixesCollection.valueChanges();

    return this.userDataDoc.collection('tracks', ref => ref.limit(1))
      .snapshotChanges()
      .take(1).do(c => {
        this.loaded = c.length > 0;
        this.initialized = true;
      })
      .toPromise();
  }

  public startLoadPlaylistChunks() {
    this._playlistOffset = 0;
    this._playlistsLoading = false;
    this._playlistsDone = false;
    this._playlistCollection.next([]);
    this.playlists = this._playlistCollection.asObservable()
      .scan((acc, val) => acc.concat(val));
    this.loadPlaylistChunk();
  }

  public loadPlaylistChunk() {
    if (this._playlistsDone || this._playlistsLoading) {
      return;
    }
    this._playlistsLoading = true;

    this.spotify.getUserPlaylists(this.user.id, {
      offset: this._playlistOffset,
      limit: this._playlistPageSize
    }).then((chunk) => {
      if (chunk.items.length < this._playlistPageSize) {
        this._playlistsDone = true;
      }
      chunk.items.forEach((playlist) => {
        (<any>playlist).ownerDisplay = playlist.owner.display_name ? playlist.owner.display_name : playlist.owner.id;
      });
      this._playlistCollection.next(chunk.items);
      this._playlistsLoading = false;
    });
    this._playlistOffset += this._playlistPageSize;
  }
  // public loadPlaylistChunk() {
  //   if (this._playlistsDone || this._playlistsLoading) {
  //     return;
  //   }
  //   this._playlistsLoading = true;
  //   this.userDataDoc.collection('playlists', ref => {
  //     return ref.orderBy('index').startAt(this._playlistOffset).limit(this._playlistPageSize);
  //   }).snapshotChanges().take(1).map(arr => {
  //     return arr.map(snap => {
  //       return snap.payload.doc.data();
  //     });
  //   }).subscribe((chunk) => {
  //     if (chunk.length < this._playlistPageSize) {
  //       this._playlistsDone = true;
  //     }
  //     this._playlistCollection.next(chunk);
  //     this._playlistsLoading = false;
  //   });
  //   this._playlistOffset += this._playlistPageSize;
  // }

  public loadAllPlaylists() {
    if (!this._playlists || !this._playlists.length) {
      this.loading = true;
      this._playlists = [];
      this.playlistCount = 0;
      this.playlistsLoaded = 0;
      return this.loadUserPlaylists().then(() => {
        return this._playlists = _.flatten(this._playlists);
      });
    } else {
      return Promise.resolve(this._playlists);
    }
  }

  public loadLibrary() {
    this.loading = true;
    this._playlists = [];
    this.playlistCount = 0;
    this.playlistsLoaded = 0;
    this._tracks = [];
    this.trackCount = 0;
    this.tracksLoaded = 0;
    this._albumHash = {};
    this._albums = [];
    this.albumCount = 0;
    this.albumsLoaded = 0;
    this._artistHash = {};
    this._artists = [];
    this.artistCount = 0;
    this.artistsLoaded = 0;
    this._genreHash = {};
    this.genreCount = 0;
    const tracks: any[] = [];
    this.loadUserPlaylists().then(() => {
      this._playlists = _.flatten(this._playlists);
      this._playlists.forEach((playlist, index) => {
        playlist.index = index;
        this.playlistCollection.doc(playlist.id).set(playlist);
      });
      console.log('playlists', this._playlists);
      return this.loadUserTracks();
    }).then(() => {
      this._tracks = _.flatten(this._tracks);
      this._tracks.forEach(track => {
        this.trackCollection.doc(track.id).set(_.omit(track, ['available_markets', 'album.available_markets']));
      });
      console.log('tracks', this._tracks);
      console.log('albumHash', Object.keys(this._albumHash).length, this._albumHash);
      return this.loadUserAlbums();
    }).then(() => {
      this._albums = _.flatten(this._albums);
      this._albums.forEach(album => {
        this.albumCollection.doc(album.id).set(_.omit(album, ['available_markets', 'tracks']));
      });
      console.log('albums', this._albums);
      console.log('artistHash', Object.keys(this._artistHash).length, this._artistHash);
      return this.loadUserArtists();
    }).then(() => {
      this._artists = _.sortBy(_.flatten(this._artists), 'name');
      this._artists.forEach(artist => {
        this.artistCollection.doc(artist.id).set(_.omit(artist, ['albums']));
      });
      Object.keys(this._genreHash).forEach(genre => {
        this.genreCollection.doc(genre).set({
          name: genre,
          artists: _.map(this._genreHash[genre], (a: any) => {
            return {
              id: a.id,
              name: a.name,
            };
          })
        });
      });
      console.log('artists', this._artists);
      console.log('genreHash', Object.keys(this._genreHash).length, this._genreHash);
    }).then(() => {
      this.loaded = true;
      this.loading = false;
      console.log('tracks', this._tracks);
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
      this._playlists.splice(this._playlists.length, 0, playlistChunk.items);
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
      this._tracks.splice(this._tracks.length, 0,
        _.map(trackChunk.items, track => {
          (<any>track.track).added_at = track.added_at;
          return track.track;
        })
      );
      trackChunk.items.forEach((track) => {
        const albumId = track.track.album.id;
        if (!this._albumHash[albumId]) {
          this.albumCount += 1;
          this._albumHash[albumId] = [track.track];
        } else {
          this._albumHash[albumId].push(track.track);
        }
      });
      if (trackChunk.total > (offset + trackChunk.limit)) {
        return this.loadUserTracks(offset + trackChunk.limit);
      }
    });
  }

  private loadUserAlbumGroup(group: any) {
    this.albumsLoaded += group.albums.length;
    this._albums.splice(this._albums.length, 0, group.albums);
    group.albums.forEach((album: any) => {
      const trackList = this._albumHash[album.id];
      // trackList.forEach((track) => {
      //   track.album = album;
      // });
      album.tracks = trackList;
      album.artists.forEach((artist) => {
        if (!this._artistHash[artist.id]) {
          this.artistCount += 1;
          this._artistHash[artist.id] = [album];
        } else {
          this._artistHash[artist.id].push(album);
        }
      });
    });
  }

  private loadUserAlbums(offset = 0): Promise<any> {
    const albumGroups = _.chunk(Object.keys(this._albumHash), 20);
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
    this._artists.splice(this._artists.length, 0, group.artists);
    group.artists.forEach((artist: any) => {
      const albums = this._artistHash[artist.id];
      artist.albums = albums;
      artist.genres.forEach((genre) => {
        if (!this._genreHash[genre]) {
          this.genreCount += 1;
          this._genreHash[genre] = [artist];
        } else {
          this._genreHash[genre].push(artist);
        }
      });
    });
  }

  private loadUserArtists(offset = 0): Promise<any> {
    const artistGroups = _.chunk(Object.keys(this._artistHash), 50);
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

  public createMix(name: string, approxTime: number, options: {
    playlists: any[],
    savePlaylist?: boolean,
    remixId?: string,
    existing?: any,
  }): Promise<any> {
    this.creatingPlaylist = true;

    let newId: string;
    if (options.existing) {
      newId = options.existing.id;
    }
    return this.getMixTracks(options.playlists, approxTime).then(() => {
      if (newId) {
        return this.spotify.changePlaylistDetails(this.user.id, newId, {
          name: name
        });
      } else {
        return this.spotify.createPlaylist(this.user.id, {
          name: name
        });
      }
    }).then((newPlaylist: any) => {
      if (!newId) {
        newId = newPlaylist.id;
      }
      return this.addTracksToPlaylist(newId, this.uniqueTracks, !!options.existing);
    }).then(() => {
      return this.spotify.getPlaylist(this.user.id, newId);
    }).then((newPlaylist) => {
      this.newPlaylist = newPlaylist;
      if (options.savePlaylist) {
        const newMix = {
          id: newPlaylist.id,
          name: newPlaylist.name,
          time: approxTime,
          images: newPlaylist.images,
          playlists: _.map(options.playlists, (p) => {
            return {
              id: p.id,
              name: p.name,
              weight: p.weight,
            };
          })
        };
        // console.log('newMix', newMix);
        return this.userDataDoc.collection('mixes').doc(newPlaylist.id).set(newMix);
      }
      return Promise.resolve();
    }).then(() => {
      this.createdPlaylist = true;
    });
  }

  public getMix(mixId: string) {
    return this.userDataDoc.collection('mixes').doc(mixId);
  }

  private getMixTracks(playlists: any[], approxTime: number) {
    const tracks: any = {};
    const trackPromises = _.map(playlists, (playlist) => {
      const trackList: any[] = [];
      tracks[playlist.id] = trackList;
      return this.getTracks(trackList, playlist.id);
    });

    const weights = _.flatten(_.map(playlists, (playlist) => {
      playlist.weight = playlist.weight || 100;
      return _.times(playlist.weight, () => playlist.id);
    }));

    return Promise.all(trackPromises).then(() => {
      Object.keys(tracks).forEach((playlistId: string) => {
        tracks[playlistId] = _.shuffle(_.flatten(tracks[playlistId]));
      });
      this.uniqueTracks = [];
      this.newPlaylistMinutes = 0;
      const addedHash: any = {};
      while (this.newPlaylistMinutes < approxTime) {
        const nextPlaylistId = weights[Math.floor(Math.random() * weights.length)];
        const playlistTracks = tracks[nextPlaylistId];
        if (playlistTracks.length) {
          const track = playlistTracks.pop();
          if (!addedHash[track.id]) {
            this.newPlaylistMinutes += track.minutes;
            this.uniqueTracks.push(track.id);
            addedHash[track.id] = true;
          }
        } else if (_.reduce(_.values(tracks), (count, list) => count + list.length, 0) === 0) {
          break;
        }
      }
    });
  }

  private getTracks(tracks: any[], playlistId: string, offset = 0): Promise<any> {
    return this.spotify.getPlaylistTracks(this.user.id, playlistId, {
      offset: offset
    }).then((playlistTracks) => {
      tracks.splice(tracks.length, 0, _.map(playlistTracks.items, track => {
        return {
          id: track.track.uri,
          minutes: track.track.duration_ms / 60 / 1000
        };
      }));
      if (playlistTracks.total > (offset + 100)) {
        return this.getTracks(tracks, playlistId, offset + 100);
      }
    });
  }

  private addTracksToPlaylist(playlistId: string, tracks: any[], replace = false) {
    const trackGroups = _.chunk(tracks, 100);
    let promise: Promise<any>;
    if (replace) {
      promise = this.spotify.replaceTracksInPlaylist(this.user.id, playlistId, trackGroups[0]);
    } else {
      promise = this.spotify.addTracksToPlaylist(this.user.id, playlistId, trackGroups[0]);
    }
    _.slice(trackGroups, 1).forEach((group) => {
      promise = promise.then(() => {
        return this.spotify.addTracksToPlaylist(this.user.id, playlistId, group);
      });
    });
    return promise;
  }

  // private deleteAllTracks(playlistId: string): Promise<any> {
  //   return this.spotify.getPlaylist(this.user.id, playlistId).then((playlist): Promise<any> => {
  //     const trackIds = _.map(playlist.tracks.items, track => track.track.uri);
  //     if (!trackIds.length) {
  //       return Promise.resolve();
  //     }
  //     const trackGroups = _.chunk(trackIds, 100);
  //     let promise = this.spotify.removeTracksFromPlaylist(this.user.id, playlistId, trackGroups[0]);
  //     _.slice(trackGroups, 1).forEach((group) => {
  //       promise = promise.then(() => {
  //         return this.spotify.removeTracksFromPlaylist(this.user.id, playlistId, group);
  //       });
  //     });
  //     return promise;
  //   });
  // }

  public remix(mix: any) {
    return this.getMixTracks(mix.playlists, mix.time).then(() => {
      return this.addTracksToPlaylist(mix.id, this.uniqueTracks, true);
    }).then(() => {
      this.snackBar.open(`Remixed ${mix.name}`, undefined, {
        duration: 3000
      });
    });
  }

  public deleteMix(mix: any) {
    return this.mixesCollection.doc(mix.id).delete();
  }

  public reset() {
    this.creatingPlaylist = false;
    this.createdPlaylist = false;

    this.uniqueTracks = [];
    this.newPlaylist = undefined;

  }
}
