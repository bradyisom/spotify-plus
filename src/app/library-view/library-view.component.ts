import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSelectionList } from '@angular/material';
import { AngularFirestore, associateQuery, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as _ from 'lodash';

import { UserLibraryService } from '../user-library.service';

@Component({
  selector: 'app-library-view',
  templateUrl: './library-view.component.html',
  styleUrls: ['./library-view.component.scss']
})
export class LibraryViewComponent implements OnInit {

  public playlistName = 'My new playlist';
  public playlistTime = 4;
  public savePlaylist = true;

  @ViewChild('playlists') public playlists: MatSelectionList;

  constructor(
    private router: Router,
    public library: UserLibraryService,
  ) { }

  ngOnInit() {
    if (!this.library.user) {
      this.router.navigate(['/']);
    } else {
      this.library.loadPlaylistChunk();
    }
  }

  getId(object: any) {
    return object.id;
  }

  public createMix() {
    const selectedPlaylists = _.map(this.playlists.selectedOptions.selected, 'value');
    this.library.createMix(this.playlistName, this.playlistTime * 60, {
      playlists: selectedPlaylists,
      savePlaylist: this.savePlaylist,
    });
    console.log('playlists', selectedPlaylists);
  }

  public reset() {
    // this.playlistName = 'My new playlist';
    this.playlists.deselectAll();
    this.library.reset();
  }

}
