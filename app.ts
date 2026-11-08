import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [
    FormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('progate-frontend');

  private readonly whatsappNumber = '971505744234';

  enquiry = {
    name: '',
    phone: '',
    email: '',
    service: '',
    message: ''
  };

  submitted = false;
  errorMessage = '';

  submitEnquiry() {

    this.submitted = false;
    this.errorMessage = '';

    if (
      !this.enquiry.name ||
      !this.enquiry.phone ||
      !this.enquiry.service
    ) {
      this.errorMessage =
        'Please fill in Name, Phone and Service.';
      return;
    }

    const message = [
      `Name: ${this.enquiry.name}`,
      `Phone: ${this.enquiry.phone}`,
      `Email: ${this.enquiry.email || 'Not provided'}`,
      `Service: ${this.enquiry.service}`,
      `Message: ${this.enquiry.message || 'No additional details'}`
    ].join('\n');

    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.location.href = whatsappUrl;

    this.submitted = true;

    this.enquiry = {
      name: '',
      phone: '',
      email: '',
      service: '',
      message: ''
    };
  }
}





