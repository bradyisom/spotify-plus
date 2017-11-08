import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSelectionList } from '@angular/material';

import * as _ from 'lodash';

import { UserLibraryService } from '../user-library.service';

@Component({
  selector: 'app-library-view',
  templateUrl: './library-view.component.html',
  styleUrls: ['./library-view.component.scss']
})
export class LibraryViewComponent implements OnInit {

  public playlistName: string;

  @ViewChild('playlists') private playlists: MatSelectionList;

  constructor(
    private router: Router,
    public library: UserLibraryService,
  ) { }

  ngOnInit() {
    if (!this.library.user) {
      this.router.navigate(['/']);
    }
  }

  public createMix() {
    const selectedPlaylists = _.map(this.playlists.selectedOptions.selected, 'value');
    this.library.createMix(this.playlistName, {
      playlists: selectedPlaylists
    });
    console.log('playlists', selectedPlaylists);
  }

  public reset() {
    this.playlistName = '';
    this.playlists.deselectAll();
    this.library.reset();
  }

}
