import { Routes } from '@angular/router';
import { HomeComponent } from './components/public/home/home.component';
import { ExploreComponent } from './components/public/explore/explore.component';
import { NftDetailComponent } from './components/public/nft-detail/nft-detail.component';
import { CreateComponent } from './components/auth-user/create/create.component';
import { ProfileComponent } from './components/public/profile/profile.component';
import { NotFoundComponent } from './components/public/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'explore', component: ExploreComponent },
  { path: 'nft/:id', component: NftDetailComponent },
  { path: 'create', component: CreateComponent },
  { path: 'profile/:walletAddress', component: ProfileComponent },

  // 404
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404', pathMatch: 'full' },
];
