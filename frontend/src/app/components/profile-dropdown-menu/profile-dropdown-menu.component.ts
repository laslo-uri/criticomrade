import { Component, OnInit, ViewChild } from '@angular/core';
import { RegistrationModalComponent } from './modals/registration-modal/registration-modal.component';

@Component({
  selector: 'app-profile-dropdown-menu',
  templateUrl: './profile-dropdown-menu.component.html',
  styleUrls: ['./profile-dropdown-menu.component.css'],
})
export class ProfileDropdownMenuComponent implements OnInit {
  @ViewChild('modal', { static: false }) modal!: RegistrationModalComponent;
  constructor() {}

  ngOnInit(): void {}

  menuToggle() {
    const toggleMenu = document.querySelector('.menu');
    if (toggleMenu) {
      toggleMenu.classList.toggle('active');
    }
  }

  openModal() {
    this.modal.open();
  }
}
