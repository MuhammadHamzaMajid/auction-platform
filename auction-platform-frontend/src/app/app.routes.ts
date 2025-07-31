import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuctionListComponent } from './auctions/auction-list/auction-list.component';
import { AuctionDetailComponent } from './auctions/auction-detail/auction-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auctions', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'auctions', component: AuctionListComponent },
  { path: 'auctions/:id', component: AuctionDetailComponent },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
  },
];
