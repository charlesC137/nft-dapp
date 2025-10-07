import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUserDetails(address: string) {
    return this.http.get<{ userDetails: User }>(`/api/user/${address}`, {
      observe: 'response',
    });
  }

  updateUserAvatar(formData: FormData) {
    return this.http.post('/api/user/upload-avatar', formData, {
      observe: 'response',
    });
  }
}
