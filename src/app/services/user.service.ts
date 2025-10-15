import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../interfaces/interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  private user = new BehaviorSubject<User | undefined>(undefined);

  user$ = this.user.asObservable();

  updateUser(user: User) {
    this.user.next(user);
  }

  getUserDetails(address: string) {
    return this.http.get<{ userDetails: User }>(`/api/user/${address}`, {
      observe: 'response',
    });
  }

  updateUserAvatar(formData: FormData) {
    return this.http.post<{ message: string }>(
      '/api/user/upload-avatar',
      formData,
      {
        observe: 'response',
      }
    );
  }

  updateUserProfile(profileDetails: {
    username: string;
    bio: string;
    privateMode: boolean;
  }) {
    return this.http.post<{ message: string; profile: User }>(
      '/api/user/update-profile',
      profileDetails,
      {
        observe: 'response',
      }
    );
  }
}
