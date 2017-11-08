import { TestBed, inject } from '@angular/core/testing';

import { UserLibraryService } from './user-library.service';

describe('UserLibraryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserLibraryService]
    });
  });

  it('should be created', inject([UserLibraryService], (service: UserLibraryService) => {
    expect(service).toBeTruthy();
  }));
});
