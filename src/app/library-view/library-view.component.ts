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

  public playlistCollection: any[];
  public playlistName = 'My new playlist';
  public playlistTime = 4;
  public savePlaylist = true;
  public loading = false;

  private existingMix: any;

  @ViewChild('playlists') public playlists: MatSelectionList;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public library: UserLibraryService,
  ) { }

  ngOnInit() {
    if (!this.library.user) {
      this.router.navigate(['/']);
      return;
    }
    const mixId = this.route.snapshot.queryParams['mixId'];
    this.loading = !!mixId;

    this.library.reset();
    this.library.loadAllPlaylists().then((playlists) => {
      this.playlistCollection = playlists;

      if (mixId) {
        this.library.getMix(mixId).valueChanges().subscribe((mix) => {
          this.existingMix = mix;
          this.playlistName = this.existingMix.name;
          this.playlistTime = Math.floor(this.existingMix.time / 60);

          const selected = this.playlists.options.filter((item) => {
            return !!_.find(this.existingMix.playlists, (p) => p.id === item.value.id);
          });
          selected.forEach((playlist) => {
            const existing = _.find(this.existingMix.playlists, (p) => p.id === playlist.value.id);
            playlist.value.weight = existing.weight;
            playlist.toggle();
          });
          this.loading = false;
        });
      }
    });
  }

  getId(object: any) {
    return object.id;
  }

  public createMix() {
    const selectedPlaylists = _.map(this.playlists.selectedOptions.selected, 'value');
    this.library.createMix(this.playlistName, this.playlistTime * 60, {
      playlists: selectedPlaylists,
      savePlaylist: this.savePlaylist,
      existing: this.existingMix,
    });
    console.log('playlists', selectedPlaylists);
  }

  public reset() {
    // this.playlistName = 'My new playlist';
    this.playlists.deselectAll();
    this.library.reset();
  }

}
