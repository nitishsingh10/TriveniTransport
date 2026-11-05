function compile(template: string) {
  return (data?: Record<string, any>): string => {
    if (!data) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = data[key];
      return val !== undefined && val !== null ? String(val) : '';
    });
  };
}

export const NotificationTemplates = {
  // Push Notification Templates
  push: {
    booking_confirmed: {
      title: compile('Booking Confirmed!'),
      body: compile('Your booking {{bookingId}} is confirmed. Track your status in the app.'),
    },
    job_assigned: {
      title: compile('New Job Assigned'),
      body: compile('You have a new trip on {{date}} for booking {{bookingId}}.'),
    },
    revision_pending: {
      title: compile('Revision Action Required'),
      body: compile('Your vendor has requested an on-site revision. Please review in the app.'),
    },
    revision_resolved: {
      title: compile('Revision Resolved'),
      body: compile('The customer has responded to your revision request.'),
    },
  },

  // WhatsApp Templates (Approved Meta Templates)
  whatsapp: {
    booking_confirmed: compile('Hi {{name}}, your booking {{bookingId}} is confirmed! Our vendor will arrive on {{date}}.'),
    job_assigned: compile('Vendor Alert: New job {{bookingId}} scheduled for {{date}}. Pickup: {{pickupAddress}}.'),
    revision_pending: compile('Hi {{name}}, the vendor has requested an extra charge for booking {{bookingId}}. Review it immediately.'),
  },

  // SMS Templates (DLT Registered Fallbacks)
  sms: {
    booking_confirmed: compile('Triveni: Booking {{bookingId}} confirmed for {{date}}.'),
    job_assigned: compile('Triveni Vendor: New job {{bookingId}} assigned for {{date}}.'),
    revision_pending: compile('Triveni: Revision requested for {{bookingId}}. Check app to approve/decline.'),
  }
};
