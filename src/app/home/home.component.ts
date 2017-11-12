import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';

import * as SpotifyWebApi from 'spotify-web-api-js';
import * as _ from 'lodash';
import * as moment from 'moment';

import { UserLibraryService } from '../user-library.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public library: UserLibraryService,
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      mixName: `My Mix Playlist`,
    });
    this.library.loadUser();
  }

}
