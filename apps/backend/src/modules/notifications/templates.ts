import Handlebars from 'handlebars';

export const NotificationTemplates = {
  // Push Notification Templates
  push: {
    booking_confirmed: {
      title: Handlebars.compile('Booking Confirmed!'),
      body: Handlebars.compile('Your booking {{bookingId}} is confirmed. Track your status in the app.'),
    },
    job_assigned: {
      title: Handlebars.compile('New Job Assigned'),
      body: Handlebars.compile('You have a new trip on {{date}} for booking {{bookingId}}.'),
    },
    revision_pending: {
      title: Handlebars.compile('Revision Action Required'),
      body: Handlebars.compile('Your vendor has requested an on-site revision. Please review in the app.'),
    },
    revision_resolved: {
      title: Handlebars.compile('Revision Resolved'),
      body: Handlebars.compile('The customer has responded to your revision request.'),
    },
  },

  // WhatsApp Templates (Approved Meta Templates)
  whatsapp: {
    booking_confirmed: Handlebars.compile('Hi {{name}}, your booking {{bookingId}} is confirmed! Our vendor will arrive on {{date}}.'),
    job_assigned: Handlebars.compile('Vendor Alert: New job {{bookingId}} scheduled for {{date}}. Pickup: {{pickupAddress}}.'),
    revision_pending: Handlebars.compile('Hi {{name}}, the vendor has requested an extra charge for booking {{bookingId}}. Review it immediately.'),
  },

  // SMS Templates (DLT Registered Fallbacks)
  sms: {
    booking_confirmed: Handlebars.compile('Triveni: Booking {{bookingId}} confirmed for {{date}}.'),
    job_assigned: Handlebars.compile('Triveni Vendor: New job {{bookingId}} assigned for {{date}}.'),
    revision_pending: Handlebars.compile('Triveni: Revision requested for {{bookingId}}. Check app to approve/decline.'),
  }
};
