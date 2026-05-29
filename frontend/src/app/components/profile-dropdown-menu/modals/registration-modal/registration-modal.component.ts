import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-registration-modal',
  templateUrl: './registration-modal.component.html',
  styleUrls: ['./registration-modal.component.css'],
})
export class RegistrationModalComponent {
  @ViewChild('registrationModal', { static: false })
  registrationModal!: ElementRef;
  registerForm!: FormGroup;

  /**** REGISTRATION DATA ****/
  name: string = '';
  username: string = '';
  email: string = '';
  password: string = '';
  repeatPassword: string = '';
  /***************************/

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {}

  open() {
    if (this.registrationModal) {
      this.registrationModal.nativeElement.style.display = 'block';
    }
  }

  close() {
    if (this.registrationModal) {
      this.registrationModal.nativeElement.style.display = 'none';
    }
  }

  validateRegistrationForm() {
    this.registerForm = this.formBuilder.group({});
  }

  // Validation functions
  isEmail(email: string): boolean {
    const emailReg =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailReg.test(email);
  }

  isNumber(value: string): boolean {
    const digitReg = /^\d+$/;
    return digitReg.test(value);
  }

  isRequired(value: string): boolean {
    return value === '';
  }

  countChars(value: string, count: number): boolean {
    return value.length === count;
  }

  isChecked(elements: NodeList): boolean {
    let hasCheck = false;
    elements.forEach((element) => {
      if ((element as HTMLElement).getAttribute('checked')) {
        hasCheck = true;
      }
    });
    return hasCheck;
  }

  onSubmit(): void {
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const usernameInput = document.getElementById(
      'username'
    ) as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;
    const repeatPasswordInput = document.getElementById(
      'repeatPassword'
    ) as HTMLInputElement;

    let isValid = true;

    // Validate name
    const nameError = document.getElementById('nameError') as HTMLElement;
    if (this.isRequired(nameInput.value)) {
      nameError.style.display = 'block';
      isValid = false;
    } else {
      nameError.style.display = 'none';
    }

    // Validate username
    const usernameError = document.getElementById(
      'usernameError'
    ) as HTMLElement;
  }

  // Validation functions for handling input changes
  onInputChange(
    inputElement: HTMLInputElement,
    errorElement: HTMLElement,
    validationFunction: Function
  ): void {
    if (validationFunction(inputElement.value)) {
      errorElement.style.display = 'none';
    }
  }
}
