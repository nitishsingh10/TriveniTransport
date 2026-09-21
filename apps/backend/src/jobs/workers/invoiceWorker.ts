import { Worker } from 'bullmq';
import { redisConnection } from '../queue';
import { prisma } from '../../config/prisma';
import PDFDocument from 'pdfkit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getEnv } from '../../config/env';

// Initialize S3 client gracefully
const getS3Client = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = getEnv();
  if (!AWS_ACCESS_KEY_ID || AWS_ACCESS_KEY_ID.startsWith('your_') || !AWS_SECRET_ACCESS_KEY) {
    return null; // mock mode
  }
  return new S3Client({
    region: AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    }
  });
};

const s3 = getS3Client();

export const invoiceWorker = new Worker('invoice-generation', async job => {
  const { bookingId } = job.data;
  console.log(`[Job] Generating invoice for booking ${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true, items: true, vendor: true }
  });

  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  // Create a PDF using pdfkit
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];
  
  doc.on('data', buffers.push.bind(buffers));
  
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      try {
        const pdfData = Buffer.concat(buffers);
        const fileName = `invoices/${booking.id}.pdf`;

        let invoiceUrl = `http://mock-s3-bucket/invoices/${booking.id}.pdf`;

        if (s3) {
          const { AWS_S3_BUCKET_NAME } = getEnv();
          await s3.send(new PutObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: fileName,
            Body: pdfData,
            ContentType: 'application/pdf'
          }));
          invoiceUrl = `https://${AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
          console.log(`[Job] Uploaded invoice to AWS S3: ${invoiceUrl}`);
        } else {
          console.log(`[Job] Mock mode: Skipped AWS S3 upload for ${fileName}`);
        }

        // Store invoice URL in booking or related table. 
        // For now, we can update a hypothetical invoiceUrl field or just log it.
        // Assuming we add it to the 'notes' or a dedicated table. Let's just log for phase 1.
        console.log(`✅ Invoice generated: ${invoiceUrl}`);
        
        resolve(invoiceUrl);
      } catch (err) {
        reject(err);
      }
    });

    // Write PDF content
    doc.fontSize(20).text('Triveni Transports - Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Booking ID: ${booking.id}`);
    doc.text(`Date: ${booking.scheduledDate.toISOString().split('T')[0]}`);
    doc.text(`Customer: ${booking.customer.name || booking.customer.phone}`);
    doc.moveDown();
    doc.text(`Total Amount: Rs. ${booking.finalAmount}`);
    doc.end();
  });
}, { connection: redisConnection });

invoiceWorker.on('failed', (job, err) => {
  console.error(`[Job] Invoice generation failed for job ${job?.id}: ${err.message}`);
});
