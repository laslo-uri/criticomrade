import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { HttpClientModule } from '@angular/common/http';
import { LogoComponent } from './components/logo/logo.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { ReviewButtonComponent } from './components/review-button/review-button.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { ProfileHeaderComponent } from './components/profile-header/profile-header.component';
import { ProfileDropdownMenuComponent } from './components/profile-dropdown-menu/profile-dropdown-menu.component';
import { RegistrationModalComponent } from './components/profile-dropdown-menu/modals/registration-modal/registration-modal.component';
import { SignInModalComponent } from './components/profile-dropdown-menu/modals/sign-in-modal/sign-in-modal.component';
import { SignOutModalComponent } from './components/profile-dropdown-menu/modals/sign-out-modal/sign-out-modal.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LogoComponent,
    SearchBarComponent,
    ReviewButtonComponent,
    NavBarComponent,
    ProfileHeaderComponent,
    ProfileDropdownMenuComponent,
    RegistrationModalComponent,
    SignInModalComponent,
    SignOutModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
