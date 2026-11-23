import crypto from 'crypto';
import path from 'path';
import { HeadObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from '../config/env';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

function getDocumentStore() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_DOCUMENTS_BUCKET_NAME } = getEnv();
  if (!AWS_S3_DOCUMENTS_BUCKET_NAME || Boolean(AWS_ACCESS_KEY_ID) !== Boolean(AWS_SECRET_ACCESS_KEY)) {
    throw { statusCode: 503, code: 'DOCUMENT_STORAGE_UNAVAILABLE', message: 'Secure document uploads are not configured. Contact Triveni support.' };
  }
  const credentials = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY }
    : undefined;
  return {
    client: new S3Client({
      region: AWS_REGION,
      ...(credentials ? { credentials } : {}),
    }),
    bucket: AWS_S3_DOCUMENTS_BUCKET_NAME,
  };
}

function safeFileName(fileName: string) {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
  return base || 'document';
}

export const VendorDocumentStore = {
  async createUploadUrl(vendorId: string, documentType: string, fileName: string, mimeType: string, size: number) {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw { statusCode: 400, code: 'UNSUPPORTED_FILE_TYPE', message: 'Upload a PDF, JPEG, PNG, or WebP file.' };
    }
    if (!Number.isInteger(size) || size < 1 || size > MAX_DOCUMENT_BYTES) {
      throw { statusCode: 400, code: 'DOCUMENT_SIZE_INVALID', message: 'Each verification document must be 10 MB or smaller.' };
    }
    const { client, bucket } = getDocumentStore();
    const objectKey = `vendor-onboarding/${vendorId}/${documentType}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
    const command = new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: mimeType });
    const uploadUrl = await getSignedUrl(client as any, command as any, { expiresIn: 300 });
    return { uploadUrl, objectKey, expiresInSeconds: 300, maxBytes: MAX_DOCUMENT_BYTES };
  },

  async verifyUploadedObject(vendorId: string, documentType: string, objectKey: string, mimeType: string) {
    if (!objectKey.startsWith(`vendor-onboarding/${vendorId}/${documentType}/`) || !ALLOWED_MIME_TYPES.has(mimeType)) {
      throw { statusCode: 400, code: 'INVALID_DOCUMENT_UPLOAD', message: 'The uploaded document does not match this partner account.' };
    }
    const { client, bucket } = getDocumentStore();
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    if (!head.ContentLength || head.ContentLength > MAX_DOCUMENT_BYTES || head.ContentType !== mimeType) {
      throw { statusCode: 400, code: 'INVALID_DOCUMENT_UPLOAD', message: 'Document is empty, too large, or has a mismatched file type.' };
    }
    return { size: head.ContentLength, mimeType: head.ContentType };
  },

  async createReadUrl(objectKey: string, mimeType: string, fileName: string) {
    const { client, bucket } = getDocumentStore();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ResponseContentType: mimeType,
      ResponseContentDisposition: `inline; filename="${safeFileName(fileName)}"`,
    });
    return getSignedUrl(client as any, command as any, { expiresIn: 120 });
  },
};
